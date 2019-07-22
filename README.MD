## Firebase Environment Setup

There are a few steps you need to complete to get your Firebase environment ready:

1. Setup Push Notifications
2. Enable the security and search rules
3. Enable the storage rules

#### Setup Firebase Cloud Functions

To handle push notifications, we use [Firebase Cloud Functions](https://firebase.google.com/docs/functions/). This service allows you to upload a script to Firebase hosting. This script monitors the realtime database and whenever a new messsage is detected, it sends a push notification to the recipient. 

Below is a summary of the steps that are required to setup push using the Firebase Cloud Functions script. For further instructions you can look at the [Firebase Documentation](https://firebase.google.com/docs/functions/get-started). 

1. Run `firebase login` and login using the browser
2. Make a new directory to store your push functions in. It can be called anything
3. Navigate to that directory using the terminal
4. Run `firebase init functions`
5. Choose the correct app from the list
6. Choose `JavaScript`
7. Choose `y` for ESLint
8. Choose `Y` to install node dependencies
9. Find the `functions` directory you've just created and copy the `index.js` file from [Github](https://github.com/chat-sdk/chat-sdk-android/tree/master/FirebasePushNotifications) into the directory
10. Run `firebase deploy` 

Now the script is active and push notifications will be set out automatically. 

#### Deploy the Firebase rules

Update your `firebase.json` file as follows:

```
"database": {
  "rules": "chat-sdk-rules.json"
}
```

Copy the `chat-sdk-rules.json` file into your project directory then run:

```
firebase deploy --only database:rules
```
  
#### Deploy the storage rules

Update your `firebase.json` file as follows:

```
"storage": {
	"rules": "chat-sdk-storage-rules.json"
}
```

Copy the `chat-sdk-storage-rules.json` file into your project directory then run:

```
firebase deploy --only storage
```
  
  