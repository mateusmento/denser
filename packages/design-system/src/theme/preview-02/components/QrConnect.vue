<script setup lang="ts">
import { onMounted, ref } from "vue";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const dataUrl = ref("");

onMounted(async () => {
  dataUrl.value = await QRCode.toDataURL("https://ui.shadcn.com", {
    margin: 0,
    width: 160,
  });
});
</script>

<template>
  <Card>
    <CardContent class="flex justify-center pt-6">
      <div class="rounded-xl border bg-white p-4 dark:bg-black dark:invert">
        <img
          v-if="dataUrl"
          :src="dataUrl"
          alt="Device pairing QR code"
          class="size-40"
          width="160"
          height="160"
        />
        <div v-else class="size-40 animate-pulse rounded-sm bg-muted" />
      </div>
    </CardContent>
    <CardHeader class="text-center">
      <CardTitle>Scan to connect your mobile device</CardTitle>
      <CardDescription>
        Open the Ledger mobile app and scan this code to link your device.
      </CardDescription>
    </CardHeader>
    <CardFooter>
      <Button variant="secondary" class="w-full">Got it</Button>
    </CardFooter>
  </Card>
</template>
