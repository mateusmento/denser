<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Buy Investment</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-1 flex-col gap-3">
      <FieldGroup class="flex-1">
        <Field>
          <FieldLabel for="invest-amount">Amount to Invest</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput id="invest-amount" default-value="1,000.00" />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel for="invest-type">Order Type</FieldLabel>
          <NativeSelect id="invest-type" model-value="market">
            <NativeSelectOption value="market">Market Order</NativeSelectOption>
            <NativeSelectOption value="limit">Limit Order</NativeSelectOption>
            <NativeSelectOption value="stop">Stop Order</NativeSelectOption>
          </NativeSelect>
          <FieldDescription>Market orders execute at the current price.</FieldDescription>
        </Field>
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Estimated Shares</span>
            <span class="text-sm font-semibold tabular-nums">1.95</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Buying Power</span>
            <span class="text-sm font-semibold tabular-nums">$12,450.00</span>
          </div>
        </div>
      </FieldGroup>
    </CardContent>
    <CardFooter class="flex-col gap-3">
      <Button class="w-full">Review Order</Button>
      <CardDescription class="text-center">
        Trades are typically executed within minutes during market hours.
      </CardDescription>
    </CardFooter>
  </Card>
</template>
