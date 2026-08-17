<!--
  Adapted from shadcn-vue create preview (MIT):
  https://github.com/unovue/shadcn-vue/tree/dev/apps/v4/registry/bases/reka/blocks/preview-02
-->
<script setup lang="ts">
import AccountAccess from "./components/AccountAccess.vue";
import BuyInvestment from "./components/BuyInvestment.vue";
import CardOverview from "./components/CardOverview.vue";
import ClaimableBalance from "./components/ClaimableBalance.vue";
import ContributionHistory from "./components/ContributionHistory.vue";
import CoverArt from "./components/CoverArt.vue";
import DividendIncome from "./components/DividendIncome.vue";
import EmptyConnectBank from "./components/EmptyConnectBank.vue";
import EmptyDistributeTrack from "./components/EmptyDistributeTrack.vue";
import EmptyExploreCatalog from "./components/EmptyExploreCatalog.vue";
import Faq from "./components/Faq.vue";
import FrontDoor from "./components/FrontDoor.vue";
import IndexInvesting from "./components/IndexInvesting.vue";
import KitchenIsland from "./components/KitchenIsland.vue";
import LoadingCard from "./components/LoadingCard.vue";
import NewMilestone from "./components/NewMilestone.vue";
import NotificationSettings from "./components/NotificationSettings.vue";
import Payments from "./components/Payments.vue";
import PayoutThreshold from "./components/PayoutThreshold.vue";
import PowerUsage from "./components/PowerUsage.vue";
import Preferences from "./components/Preferences.vue";
import QrConnect from "./components/QrConnect.vue";
import ReceivingMethod from "./components/ReceivingMethod.vue";
import RecentTransactions from "./components/RecentTransactions.vue";
import ReleaseCatalog from "./components/ReleaseCatalog.vue";
import RollerShades from "./components/RollerShades.vue";
import SavingsProgress from "./components/SavingsProgress.vue";
import SavingsTargets from "./components/SavingsTargets.vue";
import SidebarNav from "./components/SidebarNav.vue";
import SocialLinks from "./components/SocialLinks.vue";
import StockPerformance from "./components/StockPerformance.vue";
import SyncingState from "./components/SyncingState.vue";
import TransferFunds from "./components/TransferFunds.vue";
import UpcomingPayments from "./components/UpcomingPayments.vue";
</script>

<template>
  <!--
    auto-fill packs as many ~20rem columns as the viewport allows.
    Wide demos (tables / dual panels) span 2 tracks when there is room.
  -->
  <div
    class="p-4 rounded-xl border border-border bg-background"
    data-slot="capture-target"
  >
    <div
      class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] grid-flow-dense items-start gap-4"
    >
      <ContributionHistory class="min-w-0" />
      <PayoutThreshold class="min-w-0" />
      <SavingsTargets class="min-w-0" />
      <BuyInvestment class="min-w-0" />
      <RecentTransactions class="min-w-0 sm:col-span-2" />
      <EmptyDistributeTrack class="min-w-0" />
      <ClaimableBalance class="min-w-0" />
      <QrConnect class="min-w-0" />
      <Preferences class="min-w-0" />
      <DividendIncome class="min-w-0" />
      <SavingsProgress class="min-w-0" />
      <IndexInvesting class="min-w-0" />
      <KitchenIsland class="min-w-0" />
      <SyncingState class="min-w-0" />
      <AccountAccess class="min-w-0" />
      <SidebarNav class="min-w-0" />
      <Payments class="min-w-0" />
      <Faq class="min-w-0" />
      <FrontDoor class="min-w-0" />
      <CardOverview class="min-w-0" />
      <TransferFunds class="min-w-0" />
      <ReceivingMethod class="min-w-0" />
      <CoverArt class="min-w-0" />
      <PowerUsage class="min-w-0" />
      <LoadingCard class="min-w-0" />
      <EmptyConnectBank class="min-w-0" />
      <UpcomingPayments class="min-w-0" />
      <StockPerformance class="min-w-0" />
      <RollerShades class="min-w-0" />
      <EmptyExploreCatalog class="min-w-0" />
      <NewMilestone class="min-w-0" />
      <SocialLinks class="min-w-0" />
      <NotificationSettings class="min-w-0" />
      <ReleaseCatalog class="min-w-0 sm:col-span-2" />
    </div>
  </div>
</template>
