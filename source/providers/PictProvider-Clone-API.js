/**
 * Pict-Section-Clone API Provider.
 */
'use strict';

const SCOPE_STORAGE_KEY = 'retold.dataMapper.activeScope';

class CloneAPIProvider
{
	constructor(pOptions)
	{
		let tmpOptions = pOptions || {};
		this._apiBaseUrl = tmpOptions.APIBaseUrl || '/mapper';
		this._scopeOverride = (typeof tmpOptions.Scope === 'string') ? tmpOptions.Scope : null;
	}

	getScope(pCallScope)
	{
		if (typeof pCallScope === 'string') return pCallScope;
		if (typeof this._scopeOverride === 'string') return this._scopeOverride;
		if (typeof localStorage !== 'undefined')
		{
			let tmpStored = localStorage.getItem(SCOPE_STORAGE_KEY);
			if (tmpStored !== null) return tmpStored;
		}
		return '';
	}

	setScope(pScope)
	{
		if (typeof localStorage !== 'undefined')
		{
			if (pScope) localStorage.setItem(SCOPE_STORAGE_KEY, pScope);
			else localStorage.removeItem(SCOPE_STORAGE_KEY);
		}
		this._scopeOverride = (typeof pScope === 'string') ? pScope : null;
	}

	_fetch(pMethod, pPath, pBody)
	{
		let tmpOpts = { method: pMethod, headers: {} };
		if (pBody !== undefined && pBody !== null)
		{
			tmpOpts.headers['Content-Type'] = 'application/json';
			tmpOpts.body = JSON.stringify(pBody);
		}
		return fetch(this._apiBaseUrl + pPath, tmpOpts).then((pRes) =>
		{
			if (!pRes.ok)
			{
				return pRes.text().then((pText) =>
				{
					let tmpMsg = pText && pText.length < 400 ? pText : ('HTTP ' + pRes.status);
					throw new Error(tmpMsg);
				});
			}
			let tmpCT = pRes.headers.get('content-type') || '';
			if (tmpCT.indexOf('application/json') === 0) return pRes.json();
			return pRes.text();
		});
	}

	_scopeQuery(pScope)
	{
		let tmpScope = this.getScope(pScope);
		if (tmpScope === '') return '';
		return '?scope=' + encodeURIComponent(tmpScope);
	}

	listClones(pScope) { return this._fetch('GET', '/clones' + this._scopeQuery(pScope)); }

	saveClone(pRecord, pScope)
	{
		let tmpRecord = Object.assign({}, pRecord);
		if (tmpRecord.Scope === undefined) tmpRecord.Scope = this.getScope(pScope);
		if (tmpRecord.IDCloneConfig)
		{
			let tmpID = tmpRecord.IDCloneConfig;
			delete tmpRecord.IDCloneConfig;
			return this._fetch('PUT', '/clone/' + tmpID, tmpRecord);
		}
		return this._fetch('POST', '/clones', tmpRecord);
	}

	deleteClone(pID) { return this._fetch('DELETE', '/clone/' + pID); }

	runClone(pID) { return this._fetch('POST', '/clone/' + pID + '/run', {}); }
}

module.exports = CloneAPIProvider;
module.exports.SCOPE_STORAGE_KEY = SCOPE_STORAGE_KEY;
