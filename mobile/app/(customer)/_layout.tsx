import React from 'react';
import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-task" options={{ gestureEnabled: true }} />
      <Stack.Screen name="fund-task" options={{ gestureEnabled: true }} />
      <Stack.Screen name="track-task" options={{ gestureEnabled: true }} />
      <Stack.Screen name="confirm-rate" options={{ gestureEnabled: true }} />
    </Stack>
  );
}
