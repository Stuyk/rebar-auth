<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useEvents } from '../../../../../webview/composables/useEvents';
import { AuthEvents } from '../../shared/authEvents';
import { useTranslate } from '@Shared/translate';

const { t } = useTranslate('en');

const events = useEvents();

const rememberMe = ref(false);
const allValid = ref(false);
const isInvalid = ref(false);

const email = ref('');
const password = ref('');

function checkForm() {
    // Verify email contents
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email.value)) {
        allValid.value = false;
        return;
    }

    // Check password length
    if (password.value.length < 6) {
        allValid.value = false;
        return;
    }

    allValid.value = true;
}

function login() {
    isInvalid.value = false;

    if (!allValid) {
        return;
    }

    events.emitServer(AuthEvents.toServer.login, email.value, password.value, rememberMe.value);
}

function handleInvalid() {
    isInvalid.value = true;
}

function init() {
    events.on(AuthEvents.fromServer.invalidLogin, handleInvalid);
}

onMounted(init);
</script>

<template>
    <div class="flex flex-col gap-4">
        <span class="text-lg font-medium">{{ t('auth.span.login') }}</span>
        <span class="text-red-400 font-medium" v-if="isInvalid">{{ t('auth.span.bad.password') }}</span>
        <input
            type="text"
            :placeholder="t('auth.span.email')"
            v-model="email"
            autocomplete="email"
            @input="checkForm"
            class="p-2 rounded bg-neutral-100 border border-neutral-300 placeholder:text-neutral-300 outline-none focus:border-blue-300"
        />
        <input
            type="password"
            :placeholder="t('auth.span.password')"
            v-model="password"
            autocomplete="password"
            @input="checkForm"
            class="p-2 rounded bg-neutral-100 border border-neutral-300 placeholder:text-neutral-300 outline-none focus:border-blue-300"
        />
        <div class="flex gap-4">
            <input type="checkbox" v-model="rememberMe" />
            <span>{{ t('auth.span.remember') }}</span>
        </div>
        <button
            class="p-2 w-full rounded-lg text-center font-medium"
            :class="allValid ? ['bg-blue-300', 'hover:bg-blue-200'] : ['bg-neutral-200', 'cursor-default']"
            @click="allValid ? login() : () => {}"
        >
            {{ t('auth.span.login') }}
        </button>
    </div>
</template>

<style scoped>
* {
    font-family: "Inter", sans-serif;
    font-optical-sizing: auto;
    font-variation-settings: "slnt" 0;
    user-select: none;
}
</style>