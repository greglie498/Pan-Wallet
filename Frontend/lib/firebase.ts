import auth from "@react-native-firebase/auth";

// Re-export firebase auth instance
// @react-native-firebase/auth automatically initialises
// using the google-services.json file in the project root
export const firebaseAuth = auth();

export { auth };