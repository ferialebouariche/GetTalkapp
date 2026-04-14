import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import WelcomeScreen from "./src/screen/WelcomeScreen";
import HomeScreen from "./src/screen/HomeScreen";
import BsLToEng from "./src/screen/BslToEng";
import EngToBsl from "./src/screen/EngToBsl";
import Settings from "./src/screen/Settings";
import { SettingsProvider } from "./src/context/SettingsContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="BSL → ENG" component={BsLToEng} />
      <Tab.Screen name="ENG → BSL" component={EngToBsl} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
