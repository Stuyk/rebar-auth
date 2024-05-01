import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';

const Rebar = useRebar();

import { AuthEvents } from '../shared/authEvents.js';
import { Account } from '../../../main/shared/types/account.js';

type AccountData = { token: string } & Account;

const loginCallbacks: Array<(player: alt.Player) => void> = [];
const sessionKey = 'can-authenticate';
const db = Rebar.database.useDatabase();

function setAccount(player: alt.Player, account: Account) {
    Rebar.document.account.useAccountBinder(player).bind(account);
    Rebar.player.useWebview(player).hide('Auth');
    Rebar.player.useNative(player).invoke('triggerScreenblurFadeOut', 1000);
    player.deleteMeta(sessionKey);
    player.dimension = 0;
    player.emit(AuthEvents.toClient.cameraDestroy);
}

function getHash(player: alt.Player) {
    return Rebar.utility.sha256(
        player.ip + player.hwidHash + player.hwidExHash + player.socialID + player.socialClubName
    );
}

async function updateRememberMe(player: alt.Player, _id: string) {
    await db.update<AccountData>({ _id, token: getHash(player) }, Rebar.database.CollectionNames.Accounts);
}

async function tryRememberMe(player: alt.Player): Promise<boolean> {
    const token = getHash(player);
    const account = await db.get<AccountData>({ token }, Rebar.database.CollectionNames.Accounts);
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

    const account = await db.get<Account>({ email }, Rebar.database.CollectionNames.Accounts);
    const webview = Rebar.player.useWebview(player);
    if (!account) {
        webview.emit(AuthEvents.fromServer.invalidLogin);
        return;
    }

    if (!Rebar.utility.password.check(password, account.password)) {
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

    let account = await db.get<Account>({ email }, Rebar.database.CollectionNames.Accounts);
    const webview = Rebar.player.useWebview(player);
    if (account) {
        webview.emit(AuthEvents.fromServer.invalidRegister);
        return;
    }

    const _id = await db.create<Partial<Account>>(
        { email, password: Rebar.utility.password.hash(password) },
        Rebar.database.CollectionNames.Accounts
    );
    if (!_id) {
        webview.emit(AuthEvents.fromServer.invalidRegister);
        return;
    }

    account = await db.get<Account>({ _id }, Rebar.database.CollectionNames.Accounts);
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
    Rebar.player.useWebview(player).show('Auth', 'page');
    Rebar.player.useNative(player).invoke('triggerScreenblurFadeIn', 1000);
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

Rebar.useApi().register('auth-api', useAuth);

declare global {
    export interface ServerPlugin {
        ['auth-api']: ReturnType<typeof useAuth>;
    }
}
