# Firebase Environment Setup

There are a few steps you need to complete to get your Firebase environment ready:

1. Setup Push Notifications
2. Enable the security and search rules
3. Enable the storage rules

## Enable Push Notifications

To handle push notifications, we use [Firebase Cloud Functions](https://firebase.google.com/docs/functions/). This service allows you to upload a script to Firebase hosting. This script monitors the realtime database and whenever a new messsage is detected, it sends a push notification to the recipient. 

Below is a summary of the steps that are required to setup push using the Firebase Cloud Functions script. For further instructions you can look at the [Firebase Documentation](https://firebase.google.com/docs/functions/get-started). 

1. Clone this repository to your computer
2. Navigate to the directory in terminal
3. Run `firebase login` and login using the terminal
6. Run `firebase init`
4. Select Database, Functions and Storage
5. Select "Use an existing project"
7. Choose the correct app from the list
8. "What file should be used for Database Rules? (database.rules.json)" `Enter`
9. "File database.rules.json already exists. Do you want to overwrite..." `N`
10. Repeat `N` for all files
8. Choose `JavaScript`
9. Choose `y` for ESLint
10. File ... already exists. Overwrite? `N` 
11. "Do you want to install dependencies with npm now?" `Y`
12. "What file should be used for Storage Rules? (storage.rules)" `Enter`
13. "Overwrite?" `N`
11. Find the `functions` directory you've just created and add the files: `index.js` and `package.json` from [Github](https://github.com/chat-sdk/chat-sdk-firebase/tree/master/functions) 
12. Run `npm install`
13. Make sure the flag `enableV4Compatibility` matches the value used in your project
14. If you are using the user blocking module ensure that the variable in the script `blockedUsersEnabled` is set to `true` 
15. Run `firebase deploy` 

Now the script is active and push notifications will be set out automatically. 

## Deploy the Firebase rules

Firebase secures your data by allowing you to write rules to govern who can access the database and what can be written. On the Firebase dashboard click **Database** then the **Rules** tab. 

Copy the contents of the [**database.rules.json**](https://github.com/chat-sdk/chat-sdk-firebase/blob/master/database.rules.json) file into the rules and click publish.

**OR**

Make sure your `firebase.json` file is follows:

```
"database": {
  "rules": "database.rules.json"
}
```

Run:

```
firebase deploy --only database:rules
```

### Bolt

The rules are written in bolt which is a language that makes it easier to write the rules. We include an up-to-date version of the rules in the `chat-sdk-rules.json` file but if you want to update the rules yourself, you should edit the `rules.bolt` file. 

Install [Bolt](https://github.com/FirebaseExtended/bolt/blob/master/docs/guide.md):

```
npm install --g firebase-bolt
```

Then run:

```
firebase-bolt database.rules.bolt
```

This will generate a `rules.json` file which you can add to your project from the Firebase console. 

You can also update your `firebase.json` to:

```
"database": {
    "rules": "database.rules.bolt"
},  
```

## Deploy the storage rules

Make sure storage is enabled for your project. On the Firebase dashboard click **Storage** and follow the instructions to enable storage.

The storage rules are needed to enable image storage and upload for image messages and user profiles. 

Update your `firebase.json` file as follows:

```
"storage": {
	"rules": "storage.rules"
}
```

Run:

```
firebase deploy --only storage
```
  
  
