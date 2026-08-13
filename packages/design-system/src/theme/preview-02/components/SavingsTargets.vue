<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Savings Targets</CardTitle>
      <CardDescription>Active milestones for 2024</CardDescription>
      <CardAction>
        <Button variant="outline" size="sm">New Goal</Button>
      </CardAction>
    </CardHeader>
    <CardContent>
      <ItemGroup class="gap-3">
        <Item variant="muted" class="flex-col items-stretch">
          <ItemContent class="gap-3">
            <ItemDescription
              class="cn-font-heading text-xs font-medium tracking-wider text-muted-foreground uppercase"
            >
              Retirement
            </ItemDescription>
            <span class="text-3xl font-semibold tabular-nums">$420,000</span>
            <Progress :model-value="65" />
          </ItemContent>
          <ItemFooter>
            <span class="text-sm text-muted-foreground">65% achieved</span>
            <span class="text-sm font-medium tabular-nums">$273,000</span>
          </ItemFooter>
        </Item>
        <Item variant="muted" class="flex-col items-stretch">
          <ItemContent class="gap-3">
            <ItemDescription
              class="cn-font-heading text-xs font-medium tracking-wider text-muted-foreground uppercase"
            >
              Real Estate
            </ItemDescription>
            <span class="text-3xl font-semibold tabular-nums">$85,000</span>
            <Progress :model-value="32" />
          </ItemContent>
          <ItemFooter>
            <span class="text-sm text-muted-foreground">32% achieved</span>
            <span class="text-sm font-medium tabular-nums">$27,200</span>
          </ItemFooter>
        </Item>
      </ItemGroup>
    </CardContent>
    <CardFooter>
      <CardDescription class="text-center">
        You have not met your targets for this year.
      </CardDescription>
    </CardFooter>
  </Card>
</template>
