<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

const { $authClient, $orpc } = useNuxtApp();

definePageMeta({
  middleware: ["auth"],
});

const session = $authClient.useSession();

const customerState = ref<any>(null);

const privateData = useQuery({
  ...$orpc.privateData.queryOptions(),
  enabled: computed(() => !!session.value?.data?.user),
});

onMounted(async () => {
  if (session.value?.data) {
    const { data } = await $authClient.customer.state();
    customerState.value = data;
  }
});

const hasProSubscription = computed(() => customerState.value?.activeSubscriptions?.length! > 0);
</script>

<template>
  <UContainer class="py-8">
    <UPageHeader
      title="Dashboard"
      :description="session?.data?.user ? `Welcome back, ${session.data.user.name}!` : 'Loading...'"
    />

    <div class="mt-6 space-y-4">
      <UCard>
        <template #header>
          <div class="font-medium">Private Data</div>
        </template>

        <USkeleton v-if="privateData.status.value === 'pending'" class="h-6 w-48" />

        <UAlert
          v-else-if="privateData.status.value === 'error'"
          color="error"
          icon="i-lucide-alert-circle"
          title="Error loading data"
          :description="privateData.error.value?.message || 'Failed to load private data'"
        />

        <div v-else-if="privateData.data.value" class="flex items-center gap-2">
          <UIcon name="i-lucide-check-circle" class="text-success" />
          <span>{{ privateData.data.value.message }}</span>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="font-medium">Subscription</div>
        </template>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              :name="hasProSubscription ? 'i-lucide-crown' : 'i-lucide-user'"
              :class="hasProSubscription ? 'text-warning' : 'text-muted'"
            />
            <span>Plan: {{ hasProSubscription ? "Pro" : "Free" }}</span>
          </div>
          <UButton
            v-if="hasProSubscription"
            variant="outline"
            @click="
              () => {
                $authClient.customer.portal();
              }
            "
          >
            Manage Subscription
          </UButton>
          <UButton
            v-else
            @click="
              () => {
                $authClient.checkout({ slug: 'pro' });
              }
            "
          >
            Upgrade to Pro
          </UButton>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
