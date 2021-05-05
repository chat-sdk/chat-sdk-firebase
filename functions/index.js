"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const md5 = require("md5");

admin.initializeApp();

const Sound = "default";
const iOSAction = "co.chatsdk.QuickReply";
const blockedUsersEnabled = true;
const loggingEnabled = true;
const reciprocalContactsEnabled = false;

function buildContactPushMessage(title, theBody, clickAction, sound, senderId, recipientId) {
    const data = {
        chat_sdk_contact_entity_id: senderId,
    };
    return buildMessage(title, theBody, clickAction, sound, data, recipientId);
}

function buildMessagePushMessage(title, theBody, clickAction, sound, type, senderId, threadId, recipientId, encryptedMessage) {

    // Make the token payload
    let body = theBody;

    const messageType = parseInt(type);
    if (messageType === 1) {
        body = "Location";
    }
    if (messageType === 2) {
        body = "Image";
    }
    if (messageType === 3) {
        body = "Audio";
    }
    if (messageType === 4) {
        body = "Video";
    }
    if (messageType === 5) {
        body = "System";
    }
    if (messageType === 6) {
        body = "Sticker";
    }
    // if (messageType === 7) {
    //     body = "File";
    // }

    const data = {
        chat_sdk_thread_entity_id: threadId,
        chat_sdk_user_entity_id: senderId,
        chat_sdk_push_title: title,
        chat_sdk_push_body: body,
    };

    if (!unORNull(encryptedMessage)) {
        data["chat_sdk_encrypted_message"] = encryptedMessage;
    } else {
        logData("Encrypted message is null");
    }

    return buildMessage(title, body, clickAction, sound, data, recipientId);

}

function buildMessage(title, body, clickAction, sound, data, recipientId) {

    recipientId = md5(recipientId);

    logData("MD5 ID " + recipientId);

    return {
        data: data,
        // android: {
        //     priority: "HIGH",
        //
        // },
        apns: {
            headers: {
            	"apns-priority":"10",
            },
            payload: {
                aps: {
                    alert: {
                        title: title,
                        body: body,
                    },
                    badge: 1,
                    sound: sound,
                    priority: "high",
                    category: clickAction,
                },
            },
        },
        topic: recipientId,
    };
}

function logData(data) {
    if (loggingEnabled) {
    	functions.logger.log(data);
    }
}

function getUserName(usersRef, userId) {
    return getUserMeta(usersRef, userId).then((meta) => {
        return getUserNameFromMeta(meta);
    });
}

function getUserIds(threadRef, senderId) {
    return threadRef.child("users").once("value").then((users) => {

        const IDs = [];

        const usersVal = users.val();
        if (usersVal !== null) {
            for (const userID in usersVal) {
                if (Object.prototype.hasOwnProperty.call(usersVal, userID)) {
                    logData("UsersVal:" + usersVal);
                    const muted = usersVal[userID]["mute"];
                    logData("Muted:" + muted);
                    if (userID !== senderId && muted !== true) {
                        IDs.push(userID);
                    } else {
                        logData("Pushes muted for:" + userID);
                    }
                }
            }
        }

        return IDs;
    });
}

function unORNull(object) {
    return object === "undefined" || object === null || !object;
}

function getUserMeta(usersRef, userId) {
    return usersRef.child(userId).child("meta").once("value").then((meta) => {
        const metaValue = meta.val();
        if (metaValue !== null) {
            return metaValue;
        }
        return null;
    });
}

function isBlocked(usersRef, recipientId, testId) {
    if (blockedUsersEnabled) {
        return usersRef.child(recipientId).child("blocked").child(testId).once("value").then((blocked) => {
            const blockedValue = blocked.val();
            logData("recipient: " + recipientId + ", testId: "+ testId + "val: " + JSON.stringify(blockedValue) + ", send push: " + blockedValue === null);
            return blockedValue !== null;
        });
    } else {
        return Promise.resolve(false);
    }
}

// function getBlockedUsers(usersRef, userId) {
//     if (blockedUsersEnabled) {
//         return usersRef.child(userId).child("blocked").once("value").then((blocked) => {
//             let blockedValue = blocked.val();

//             // logData("usersRef " + usersRef.toString() + " uid: " + userId + ", val: " + blockedValue);

//             if (blockedValue !== null) {
//                 return blockedValue;
//             }
//             return null;
//         });
//     } else {
//         return Promise.resolve(null);
//     }
// }

function getUserNameFromMeta(metaValue) {
    if (metaValue !== null) {
        let name = metaValue["name"];
        if (unORNull(name)) {
            name = "Unknown";
        }
        return name;
    }
    return null;
}

exports.pushToChannels = functions.https.onCall((data, context) => {

    const body = data.body;

    let action = data.action;
    if (!action) {
        action = iOSAction;
    }

    let sound = data.sound;
    if (!sound) {
        sound = Sound;
    }

    const type = data.type;
    const senderId = String(data.senderId);
    const threadId = String(data.threadId);

    let encryptedMessage = null;

    if (Object.prototype.hasOwnProperty.call(data, "encrypted-message")) {
	    encryptedMessage = String(data["encrypted-message"]);
    }

    const senderName = String(data.senderName);

    const userIds = data.userIds;

    if (unORNull(senderId)) {
        throw new functions.https.HttpsError("invalid-argument", "Sender ID not valid");
    }

    if (unORNull(senderName)) {
        throw new functions.https.HttpsError("invalid-argument", "Sender Name not valid");
    }

    if (unORNull(threadId)) {
        throw new functions.https.HttpsError("invalid-argument", "Thread ID not valid");
    }

    if (unORNull(body)) {
        throw new functions.https.HttpsError("invalid-argument", "Body not valid");
    }

    const status = {};
    for (const uid in userIds) {
        if (Object.prototype.hasOwnProperty.call(userIds, uid)) {
            // const userName = userIds[uid];
            const message = buildMessagePushMessage(senderName, body, action, sound, type, senderId, threadId, uid, encryptedMessage);
            status[uid] = message;
            admin.messaging().send(message);
        }
    }
    // return Promise.all(promises);
    // return res.send(status);
    return status;

});

if (reciprocalContactsEnabled) {
    exports.contactListener = functions.database.ref("{rootPath}/users/{userId}/contacts/{contactId}").onCreate((contactSnapshot, context) => {

        // const contactVal = contactSnapshot.val();
        const userId = context.params.userId;
        const contactId = context.params.contactId;
        const rootPath = context.params.rootPath;

        if (!unORNull(userId) && !unORNull(contactId)) {

            const ref = admin.database().ref(rootPath).child("users").child(contactId).child("contacts").child(userId);
            const usersRef = admin.database().ref(rootPath).child("users");

            return ref.set({type: 0}).then(() => {
                return getUserName(usersRef, userId).then((name) => {
                    const message = buildContactPushMessage(name, "Added you as a contact", iOSAction, Sound, userId, contactId);
                    return admin.messaging().send(message).then((success) => {
                        return success;
                    }).catch((error) => {
                        logData(error.message);
                    });
                });
            });
        }

    });
}

exports.pushListener = functions.database.ref("{rootPath}/threads/{threadId}/messages/{messageId}").onCreate((messageSnapshot, context) => {

    const messageValue = messageSnapshot.val();

    const senderId = messageValue["from"];

    if (unORNull(senderId)) {
        return 0;
    }

    const threadId = context.params.threadId;
    const rootPath = context.params.rootPath;

    const threadRef = admin.database().ref(rootPath).child("threads").child(threadId);
    const usersRef = admin.database().ref(rootPath).child("users");

    return getUserMeta(usersRef, senderId).then((meta) => {
        return getUserIds(threadRef, senderId).then((IDs) => {

            const name = getUserNameFromMeta(meta);

            const promises = [];
            for (const i in IDs) {
                if (Object.prototype.hasOwnProperty.call(IDs, i)) {
                    const userId = IDs[i];
                    promises.push(isBlocked(usersRef, userId, senderId).then((isBlocked) => {
                        if (!isBlocked) {
                            let messageText;

                            const meta = messageValue["meta"];
                            if (!unORNull(meta)) {
                                messageText = meta["text"];
                            }

                            const encryptedMessage = meta["encrypted-message"];

                            if (!unORNull(messageText)) {
                                const message = buildMessagePushMessage(name, messageText, iOSAction, Sound, messageValue["type"], senderId, threadId, userId, encryptedMessage);
                                logData("Send push: " + messageText + ", to: " + userId);
                                admin.messaging().send(message).then((success) => {
                                    return success;
                                }).catch((error) => {
                                    logData(error.message);
                                });
                            }
                        } else {
                            logData("push blocked to: " + userId);
                        }
                        return 0;
                    }));
                }
            }
            return Promise.all(promises);
        });
    });

});
