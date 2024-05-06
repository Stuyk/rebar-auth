<script lang="ts" setup>
import '../translate/index'; // Import translations

import { ref, onMounted } from 'vue';
import AuthLogin from './components/AuthLogin.vue';
import AuthRegister from './components/AuthRegister.vue';

import { useTranslate } from '@Shared/translate';

const { t } = useTranslate('en');

const showLogin = ref(true);
</script>

<template>
    <div class="flex items-center justify-center w-screen h-screen overflow-hidden text-neutral-950">
        <div class="flex items-center justify-center w-screen h-screen overflow-hidden text-neutral-950">
            <div class="bg-neutral-50 p-12 rounded-lg shadow-lg w-1/2">
                <div class="flex flex-row gap-6">
                    <div class="flex flex-col w-1/4">
                        <span
                            @click="showLogin = !showLogin"
                            class="font-medium cursor-pointer text-blue-500 hover:text-blue-300"
                        >
                            {{ showLogin ? t('auth.span.new.user') : t('auth.span.existing.user') }}
                        </span>
                    </div>
                    <div class="flex flex-col w-3/4">
                        <AuthLogin v-if="showLogin" />
                        <AuthRegister v-else />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
