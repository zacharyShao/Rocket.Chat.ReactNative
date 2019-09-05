import { AsyncStorage } from 'react-native';
import { put, takeLatest, all } from 'redux-saga/effects';
import SplashScreen from 'react-native-splash-screen';
import RNUserDefaults from 'rn-user-defaults';

import * as actions from '../actions';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { toggleMarkdown } from '../actions/markdown';
import { toggleCrashReport } from '../actions/crashReport';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import Navigation from '../lib/Navigation';
import update from '../utils/update';
import {
	SERVERS, SERVER_ICON, SERVER_NAME, SERVER_URL, TOKEN, USER_ID
} from '../constants/userDefaults';
import { isIOS } from '../utils/deviceInfo';
import watermelon from '../lib/database';

const restore = function* restore() {
	try {
		let hasMigration;
		if (isIOS) {
			yield RNUserDefaults.setName('group.ios.chat.rocket');
			hasMigration = yield AsyncStorage.getItem('hasMigration');
		}

		let { token, server } = yield all({
			token: RNUserDefaults.get(RocketChat.TOKEN_KEY),
			server: RNUserDefaults.get('currentServer')
		});

		// get native credentials
		if (isIOS && !hasMigration) {
			const { serversDB } = watermelon.databases;
			const servers = yield RNUserDefaults.objectForKey(SERVERS);
			if (servers) {
				servers.forEach(async(serverItem) => {
					const serverInfo = {
						id: serverItem[SERVER_URL],
						name: serverItem[SERVER_NAME],
						iconURL: serverItem[SERVER_ICON]
					};
					try {
						await update(serversDB, 'servers', serverInfo);
						await RNUserDefaults.set(`${ RocketChat.TOKEN_KEY }-${ serverInfo.id }`, serverItem[USER_ID]);
					} catch (e) {
						log(e);
					}
				});
				yield AsyncStorage.setItem('hasMigration', '1');
			}

			// if not have current
			if (servers && servers.length !== 0 && (!token || !server)) {
				server = servers[0][SERVER_URL];
				token = servers[0][TOKEN];
			}
		}

		const sortPreferences = yield RocketChat.getSortPreferences();
		yield put(setAllPreferences(sortPreferences));

		const useMarkdown = yield RocketChat.getUseMarkdown();
		yield put(toggleMarkdown(useMarkdown));

		const allowCrashReport = yield RocketChat.getAllowCrashReport();
		yield put(toggleCrashReport(allowCrashReport));

		if (!token || !server) {
			yield all([
				RNUserDefaults.clear(RocketChat.TOKEN_KEY),
				RNUserDefaults.clear('currentServer')
			]);
			yield put(actions.appStart('outside'));
		} else if (server) {
			const { serversDB } = watermelon.databases;
			const serverCollections = serversDB.collections.get('servers');
			const serverObj = yield serverCollections.find(server);
			yield put(selectServerRequest(server, serverObj && serverObj.version));
		}

		yield put(actions.appReady({}));
	} catch (e) {
		log(e);
	}
};

const start = function* start({ root }) {
	if (root === 'inside') {
		yield Navigation.navigate('InsideStack');
	} else if (root === 'setUsername') {
		yield Navigation.navigate('SetUsernameView');
	} else if (root === 'outside') {
		yield Navigation.navigate('OutsideStack');
	}
	SplashScreen.hide();
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
	yield takeLatest(APP.START, start);
};
export default root;
