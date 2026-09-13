<script setup lang="ts">
import ApiState from '@/shared/ui/ApiState.vue'
import OfferComposer from './OfferComposer.vue'
import OfferList from './OfferList.vue'
import { useOffersWorkspace } from '../model/use-offers-workspace'

const workspace = useOffersWorkspace()
</script>

<template>
  <div class="space-y-5">
    <OfferComposer
      v-if="workspace.session.isStaff"
      :deals="workspace.visibleDeals.value"
      :selected-deal-id="workspace.selectedDealId.value"
      :discount="workspace.discount.value"
      :parking-units="workspace.availableParking.value"
      :storage-units="workspace.availableStorage.value"
      :parking-unit-id="workspace.parkingUnitId.value"
      :storage-unit-id="workspace.storageUnitId.value"
      :ancillary-pending="workspace.ancillaryUnits.isPending.value"
      :calculation="workspace.calculation.data.value"
      :pending="workspace.calculation.isPending.value || workspace.generate.isPending.value"
      :error="workspace.calculation.error.value || workspace.generate.error.value"
      @update:selected-deal-id="workspace.selectedDealId.value = $event"
      @update:discount="workspace.discount.value = $event"
      @update:parking-unit-id="workspace.parkingUnitId.value = $event"
      @update:storage-unit-id="workspace.storageUnitId.value = $event"
      @calculate="workspace.calculation.mutate()"
      @generate="workspace.generate.mutate()"
    />
    <p
      v-if="workspace.generate.data.value"
      role="status"
      class="rounded-xl bg-blueprint-soft p-4 text-sm"
    >
      {{ workspace.generate.data.value.message }} Реестр обновлён по данным backend.
    </p>
    <ApiState
      :pending="workspace.offers.isPending.value"
      :error="workspace.offers.error.value"
      @retry="workspace.offers.refetch()"
    >
      <OfferList
        :offers="workspace.offers.data.value ?? []"
        :role="workspace.session.user?.role"
        :decision-reason="workspace.decisionReason.value"
        :pending="
          workspace.requestApproval.isPending.value ||
          workspace.decide.isPending.value ||
          workspace.download.isPending.value ||
          workspace.send.isPending.value
        "
        @update:decision-reason="workspace.decisionReason.value = $event"
        @request-approval="workspace.requestApproval.mutate($event)"
        @approve="workspace.decide.mutate({ id: $event, decision: 'approve' })"
        @reject="workspace.decide.mutate({ id: $event, decision: 'reject' })"
        @download="workspace.download.mutate($event)"
        @send="workspace.send.mutate($event)"
      />
    </ApiState>
    <p
      v-if="workspace.send.data.value?.status === 'sent'"
      role="status"
      class="rounded-xl bg-blueprint-soft p-4 text-sm"
    >
      КП отправлено на {{ workspace.send.data.value.recipient }}. Доставка зафиксирована в backend.
    </p>
    <p
      v-if="
        workspace.requestApproval.error.value ||
        workspace.decide.error.value ||
        workspace.download.error.value ||
        workspace.send.error.value
      "
      role="alert"
      class="text-sm text-risk"
    >
      {{
        workspace.requestApproval.error.value?.message ||
        workspace.decide.error.value?.message ||
        workspace.download.error.value?.message ||
        workspace.send.error.value?.message
      }}
    </p>
  </div>
</template>
