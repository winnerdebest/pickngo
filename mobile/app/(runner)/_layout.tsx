import React from 'react';
import { Stack } from 'expo-router';

export default function RunnerLayout() {
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
      <Stack.Screen name="task-detail" options={{ gestureEnabled: true }} />
      <Stack.Screen name="active-task" options={{ gestureEnabled: true }} />
    </Stack>
  );
}
