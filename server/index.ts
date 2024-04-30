import * as alt from 'alt-server';

import { useDatabase } from '@Server/database/index.js';
import { CollectionNames } from '@Server/document/shared.js';
import { useWebview } from '@Server/player/webview.js';
import { check, hash } from '@Server/utility/password.js';
import { useAccountBinder } from '@Server/document/index.js';
import { useNative } from '@Server/player/native.js';
import { sha256 } from '@Server/utility/hash.js';

import { AuthEvents } from '../shared/authEvents.js';
import { Account } from '../../../main/shared/types/account.js';
import { useApi } from '../../../main/server/api/index.js';

type AccountData = { token: string } & Account;

const loginCallbacks: Array<(player: alt.Player) => void> = [];
const sessionKey = 'can-authenticate';
const db = useDatabase();

function setAccount(player: alt.Player, account: Account) {
    useAccountBinder(player).bind(account);
    useWebview(player).hide('Auth');
    useNative(player).invoke('triggerScreenblurFadeOut', 1000);
    player.deleteMeta(sessionKey);
    player.dimension = 0;
    player.emit(AuthEvents.toClient.cameraDestroy);
}

function getHash(player: alt.Player) {
    return sha256(player.ip + player.hwidHash + player.hwidExHash + player.socialID + player.socialClubName);
}

async function updateRememberMe(player: alt.Player, _id: string) {
    await db.update<AccountData>({ _id, token: getHash(player) }, CollectionNames.Accounts);
}

async function tryRememberMe(player: alt.Player): Promise<boolean> {
    const token = getHash(player);
    const account = await db.get<AccountData>({ token }, CollectionNames.Accounts);
    if (!account) {
        return false;
    }

    setAccount(player, account);
    return true;
}

async function handleLogin(player: alt.Player, email: string, password: string, rememberMe: boolean) {
    if (!player.getMeta(sessionKey)) {
        player.kick('Not allowed to authenticate');
        return;
    }

    const account = await db.get<Account>({ email }, CollectionNames.Accounts);
    const webview = useWebview(player);
    if (!account) {
        webview.emit(AuthEvents.fromServer.invalidLogin);
        return;
    }

    if (!check(password, account.password)) {
        webview.emit(AuthEvents.fromServer.invalidLogin);
        return;
    }

    if (rememberMe) {
        await updateRememberMe(player, account._id);
    }

    setAccount(player, account);
}

async function handleRegister(player: alt.Player, email: string, password: string) {
    if (!player.getMeta(sessionKey)) {
        player.kick('Not allowed to authenticate');
        return;
    }

    let account = await db.get<Account>({ email }, CollectionNames.Accounts);
    const webview = useWebview(player);
    if (account) {
        webview.emit(AuthEvents.fromServer.invalidRegister);
        return;
    }

    const _id = await db.create<Partial<Account>>({ email, password: hash(password) }, CollectionNames.Accounts);
    if (!_id) {
        webview.emit(AuthEvents.fromServer.invalidRegister);
        return;
    }

    account = await db.get<Account>({ _id }, CollectionNames.Accounts);
    if (!account) {
        webview.emit(AuthEvents.fromServer.invalidRegister);
        return;
    }

    setAccount(player, account);
}

async function handleConnect(player: alt.Player) {
    const didLogin = await tryRememberMe(player);
    if (didLogin) {
        return;
    }

    player.dimension = player.id + 1;
    player.setMeta(sessionKey, true);
    player.emit(AuthEvents.toClient.cameraCreate);
    useWebview(player).show('Auth', 'page');
    useNative(player).invoke('triggerScreenblurFadeIn', 1000);
}

alt.onClient(AuthEvents.toServer.login, handleLogin);
alt.onClient(AuthEvents.toServer.register, handleRegister);
alt.on('playerConnect', handleConnect);

export function useAuth() {
    function onLogin(callback: (player: alt.Player) => void) {
        loginCallbacks.push(callback);
    }

    return {
        onLogin,
    };
}

useApi().register('auth-api', useAuth);

declare global {
    export interface ServerPlugin {
        ['auth-api']: ReturnType<typeof useAuth>;
    }
}
