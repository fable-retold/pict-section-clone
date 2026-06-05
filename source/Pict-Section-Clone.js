/**
 * Pict-Section-Clone
 *
 * Embeddable Pict view for managing source→destination Clone configs:
 * full-table-copy from one beacon to another. Same shape as the other
 * sections (list / editor / run-result panel).
 *
 * The Run path on the data-mapper:
 *   - Resolves the Tables list (a JSON array stored on the record;
 *     '*' means "all tables on the source connection" — server-side
 *     introspects the source to expand it)
 *   - For each table, pulls all rows from the source via beacon REST
 *     and POSTs each through the target beacon (so meadow.doCreate
 *     sets audit columns on the destination)
 *   - DDL is NOT performed — target tables must already exist with
 *     compatible schemas. This matches the "lake mirror" intent: the
 *     operator pre-provisions the lake schema once.
 */
'use strict';

const libPictView    = require('pict-view');
const libDefaultConf = require('./Pict-Section-Clone-DefaultConfiguration.js');
const libCSS         = require('./Pict-Section-Clone-CSS.js');
const libAPIProvider = require('./providers/PictProvider-Clone-API.js');

class PictSectionClone extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, libDefaultConf, pOptions || {});
		super(pFable, tmpOptions, pServiceHash);

		this._API = new libAPIProvider({ APIBaseUrl: this.options.APIBaseUrl, Scope: this.options.Scope });
		this._state = { view: 'list', clones: [], editing: null };

		if (this.pict && this.pict.CSSMap && typeof this.pict.CSSMap.addCSS === 'function')
		{
			this.pict.CSSMap.addCSS('Pict-Section-Clone-CSS', libCSS, 500);
		}
	}

	openList()        { this._state.view = 'list'; this._state.editing = null; this.render(); }
	openEditor(pRec)  { this._state.editing = pRec || null; this._state.view = 'edit'; this.render(); }
	refresh()         { this.render(); }

	onAfterRender(pRenderable, pAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();
		this._mount();
		return super.onAfterRender(pRenderable, pAddress, pRecord, pContent);
	}

	_mount()
	{
		let tmpDest = this._dest();
		if (!tmpDest) return;
		tmpDest.innerHTML = '';
		tmpDest.classList.add('psc-root');
		tmpDest.classList.add('psc-mode-' + this.options.Mode);
		if (this.options.ShowToolbar) tmpDest.appendChild(this._buildToolbar());
		let tmpContent = document.createElement('div');
		tmpContent.className = 'psc-content';
		tmpDest.appendChild(tmpContent);
		if (this._state.view === 'list')      this._mountList(tmpContent);
		else if (this._state.view === 'edit') this._mountEditor(tmpContent);
	}

	_dest()
	{
		let tmpAddr = this.options.ContentDestinationAddress;
		if (!tmpAddr || typeof document === 'undefined') return null;
		return document.querySelector(tmpAddr);
	}

	_buildToolbar()
	{
		let tmpBar = document.createElement('div');
		tmpBar.className = 'psc-toolbar';
		let tmpTitle = document.createElement('h2'); tmpTitle.textContent = 'Clones';
		tmpBar.appendChild(tmpTitle);

		if (this._state.view !== 'list')
		{
			let tmpBack = document.createElement('a');
			tmpBack.className = 'psc-btn'; tmpBack.textContent = '← All clones';
			tmpBack.href = 'javascript:void(0)'; tmpBack.onclick = () => this.openList();
			tmpBar.appendChild(tmpBack);
		}

		let tmpSpacer = document.createElement('span');
		tmpSpacer.className = 'psc-toolbar-spacer';
		tmpBar.appendChild(tmpSpacer);

		let tmpScopeLabel = document.createElement('label');
		tmpScopeLabel.textContent = 'scope';
		let tmpScopeInput = document.createElement('input');
		tmpScopeInput.type = 'text'; tmpScopeInput.className = 'psc-scope-input';
		tmpScopeInput.placeholder = '(global)'; tmpScopeInput.spellcheck = false;
		tmpScopeInput.value = this._API.getScope();
		let tmpDebounce = null;
		tmpScopeInput.oninput = () =>
		{
			clearTimeout(tmpDebounce);
			tmpDebounce = setTimeout(() =>
			{
				this._API.setScope(tmpScopeInput.value.trim());
				this._state.view = 'list'; this._state.editing = null;
				this.render();
			}, 300);
		};
		tmpScopeLabel.appendChild(tmpScopeInput);
		let tmpScopeHint = document.createElement('span');
		tmpScopeHint.className = 'psc-scope-hint';
		tmpScopeHint.textContent = 'empty = global • * = all';
		tmpScopeLabel.appendChild(tmpScopeHint);
		tmpBar.appendChild(tmpScopeLabel);

		if (this.options.Mode === 'manage' && this._state.view === 'list')
		{
			let tmpNew = document.createElement('a');
			tmpNew.className = 'psc-btn psc-btn-primary'; tmpNew.textContent = '+ New clone';
			tmpNew.href = 'javascript:void(0)'; tmpNew.onclick = () => this.openEditor(null);
			tmpBar.appendChild(tmpNew);
		}
		return tmpBar;
	}

	// ── List view ──────────────────────────────────────────────────

	_mountList(pHost)
	{
		let tmpStatus = document.createElement('div');
		tmpStatus.className = 'psc-empty'; tmpStatus.textContent = 'Loading…';
		pHost.appendChild(tmpStatus);

		this._API.listClones().then((pData) =>
		{
			pHost.innerHTML = '';
			let tmpRows = (pData && pData.Clones) || [];
			this._state.clones = tmpRows;
			if (tmpRows.length === 0)
			{
				let tmpEmpty = document.createElement('div');
				tmpEmpty.className = 'psc-empty';
				let tmpScope = this._API.getScope();
				tmpEmpty.textContent = 'No clone configs in '
					+ (tmpScope === '' ? 'global scope' : ('scope "' + tmpScope + '"'))
					+ '. Use scope=* to see all.';
				pHost.appendChild(tmpEmpty);
				return;
			}
			let tmpList = document.createElement('div');
			tmpList.className = 'psc-list';
			for (let i = 0; i < tmpRows.length; i++) tmpList.appendChild(this._buildListRow(tmpRows[i]));
			pHost.appendChild(tmpList);
		}).catch((pErr) =>
		{
			pHost.innerHTML = '';
			let tmpErr = document.createElement('div');
			tmpErr.className = 'psc-error';
			tmpErr.textContent = 'Failed to load clones: ' + pErr.message;
			pHost.appendChild(tmpErr);
		});
	}

	_buildListRow(pRow)
	{
		let tmpRow = document.createElement('div');
		tmpRow.className = 'psc-list-row';

		let tmpHash = document.createElement('div');
		tmpHash.className = 'psc-row-hash';
		tmpHash.textContent = pRow.Hash;
		if (pRow.Scope) { let tmpScope = document.createElement('span'); tmpScope.className = 'psc-row-scope'; tmpScope.textContent = '· ' + pRow.Scope; tmpHash.appendChild(tmpScope); }
		tmpRow.appendChild(tmpHash);

		let tmpName = document.createElement('div');
		tmpName.className = 'psc-row-name';
		tmpName.textContent = pRow.Name || '(unnamed)';
		tmpRow.appendChild(tmpName);

		let tmpFlowWrap = document.createElement('div');
		let tmpFlow = document.createElement('div');
		tmpFlow.className = 'psc-row-flow';
		tmpFlow.textContent = (pRow.SourceBeaconName || '?') + '/' + (pRow.SourceConnectionHash || '?')
			+ ' → ' + (pRow.TargetBeaconName || '?') + '/' + (pRow.TargetConnectionHash || '?');
		tmpFlowWrap.appendChild(tmpFlow);
		let tmpTables = document.createElement('div');
		tmpTables.className = 'psc-row-tables';
		let tmpTablesText = pRow.Tables;
		if (typeof tmpTablesText === 'string') {
			try { let arr = JSON.parse(tmpTablesText); if (Array.isArray(arr)) tmpTablesText = arr.join(', '); }
			catch (e) { /* leave as-is */ }
		} else if (Array.isArray(tmpTablesText)) tmpTablesText = tmpTablesText.join(', ');
		tmpTables.textContent = 'tables: ' + (tmpTablesText || '*');
		tmpFlowWrap.appendChild(tmpTables);
		tmpRow.appendChild(tmpFlowWrap);

		let tmpActions = document.createElement('div');
		tmpActions.className = 'psc-row-actions';
		if (this.options.Mode === 'manage')
		{
			let tmpRun = document.createElement('a');
			tmpRun.className = 'psc-btn psc-btn-success'; tmpRun.textContent = '▶ Run';
			tmpRun.href = 'javascript:void(0)'; tmpRun.onclick = () => this._runClone(pRow, tmpRow);
			tmpActions.appendChild(tmpRun);
			let tmpEdit = document.createElement('a');
			tmpEdit.className = 'psc-btn'; tmpEdit.textContent = 'Edit';
			tmpEdit.href = 'javascript:void(0)'; tmpEdit.onclick = () => this.openEditor(pRow);
			tmpActions.appendChild(tmpEdit);
			let tmpDel = document.createElement('a');
			tmpDel.className = 'psc-btn psc-btn-danger'; tmpDel.textContent = 'Delete';
			tmpDel.href = 'javascript:void(0)'; tmpDel.onclick = () => this._confirmDelete(pRow);
			tmpActions.appendChild(tmpDel);
		}
		tmpRow.appendChild(tmpActions);
		return tmpRow;
	}

	_runClone(pRow, pRowEl)
	{
		if (!pRow.IDCloneConfig) { this._toast('Run failed: missing IDCloneConfig', 'error'); return; }
		let tmpRunBtn = pRowEl.querySelector('.psc-btn-success');
		let tmpOriginal = tmpRunBtn ? tmpRunBtn.textContent : '';
		if (tmpRunBtn) { tmpRunBtn.textContent = 'Running…'; tmpRunBtn.classList.add('psc-btn-disabled'); }
		this._API.runClone(pRow.IDCloneConfig).then((pResult) =>
		{
			if (tmpRunBtn) { tmpRunBtn.textContent = tmpOriginal; tmpRunBtn.classList.remove('psc-btn-disabled'); }
			this._renderRunResult(pRowEl, pRow, pResult, false);
		}).catch((pErr) =>
		{
			if (tmpRunBtn) { tmpRunBtn.textContent = tmpOriginal; tmpRunBtn.classList.remove('psc-btn-disabled'); }
			this._renderRunResult(pRowEl, pRow, { Error: pErr.message }, true);
		});
	}

	_renderRunResult(pRowEl, pRow, pResult, pIsError)
	{
		let tmpExisting = pRowEl.nextElementSibling;
		if (tmpExisting && tmpExisting.classList && tmpExisting.classList.contains('psc-run-result')) tmpExisting.remove();
		let tmpPanel = document.createElement('div');
		tmpPanel.className = 'psc-run-result ' + (pIsError ? 'psc-run-error' : 'psc-run-success');
		let tmpHeader = document.createElement('h4');
		tmpHeader.textContent = pIsError ? ('✗  ' + pRow.Hash + ' — failed') : ('✓  ' + pRow.Hash + ' — completed');
		tmpPanel.appendChild(tmpHeader);
		if (pIsError)
		{
			let tmpErr = document.createElement('div');
			tmpErr.style.color = '#fecaca'; tmpErr.style.fontFamily = 'monospace'; tmpErr.style.fontSize = '12px';
			tmpErr.textContent = pResult.Error;
			tmpPanel.appendChild(tmpErr);
		}
		else
		{
			let tmpStats = document.createElement('div');
			tmpStats.className = 'psc-run-stats';
			let tmpFields = ['TablesProcessed', 'RowsRead', 'RowsWritten', 'Errors', 'ElapsedMs'];
			for (let i = 0; i < tmpFields.length; i++)
			{
				let tmpKey = tmpFields[i];
				if (pResult[tmpKey] === undefined || pResult[tmpKey] === null) continue;
				let tmpStat = document.createElement('div');
				tmpStat.className = 'psc-run-stat';
				let tmpLabel = document.createElement('span');
				tmpLabel.className = 'psc-stat-label'; tmpLabel.textContent = tmpKey;
				let tmpValue = document.createElement('span');
				tmpValue.className = 'psc-stat-value'; tmpValue.textContent = String(pResult[tmpKey]);
				tmpStat.appendChild(tmpLabel); tmpStat.appendChild(tmpValue);
				tmpStats.appendChild(tmpStat);
			}
			tmpPanel.appendChild(tmpStats);
			if (Array.isArray(pResult.PerTable) && pResult.PerTable.length > 0)
			{
				let tmpTables = document.createElement('div');
				tmpTables.className = 'psc-run-tables';
				for (let i = 0; i < pResult.PerTable.length; i++)
				{
					let tmpT = pResult.PerTable[i];
					let tmpLine = document.createElement('div');
					tmpLine.className = 'psc-run-table-line';
					let tmpName = document.createElement('span');
					tmpName.className = 'psc-tname'; tmpName.textContent = tmpT.Table || '?';
					tmpLine.appendChild(tmpName);
					let tmpDetail = document.createElement('span');
					tmpDetail.textContent = ' read ' + (tmpT.RowsRead || 0) + ', wrote ' + (tmpT.RowsWritten || 0)
						+ (tmpT.Errors ? (', errors ' + tmpT.Errors) : '')
						+ (tmpT.Error ? (' — ' + tmpT.Error) : '');
					tmpLine.appendChild(tmpDetail);
					tmpTables.appendChild(tmpLine);
				}
				tmpPanel.appendChild(tmpTables);
			}
		}
		pRowEl.parentNode.insertBefore(tmpPanel, pRowEl.nextSibling);
	}

	_confirmDelete(pRow)
	{
		let tmpModal = this.pict.views && this.pict.views.Modal;
		if (tmpModal && typeof tmpModal.confirm === 'function')
		{
			tmpModal.confirm('Delete clone "' + (pRow.Name || pRow.Hash) + '"? This cannot be undone.',
				{ confirmLabel: 'Delete', cancelLabel: 'Cancel', dangerous: true })
				.then((pOk) => { if (pOk) this._doDelete(pRow); });
			return;
		}
		// eslint-disable-next-line no-alert
		if (typeof confirm === 'function' && confirm('Delete clone "' + pRow.Hash + '"?')) this._doDelete(pRow);
	}

	_doDelete(pRow)
	{
		if (!pRow.IDCloneConfig) { this._toast('Delete failed: missing IDCloneConfig', 'error'); return; }
		this._API.deleteClone(pRow.IDCloneConfig).then(() =>
		{
			this._toast('Clone deleted.', 'success');
			this.openList();
		}).catch((pErr) => this._toast('Delete failed: ' + pErr.message, 'error'));
	}

	_toast(pMsg, pType)
	{
		let tmpModal = this.pict.views && this.pict.views.Modal;
		if (tmpModal && typeof tmpModal.toast === 'function') { tmpModal.toast(pMsg, { type: pType || 'info' }); return; }
		// eslint-disable-next-line no-console
		console.log('[psc]', pMsg);
	}

	// ── Editor ─────────────────────────────────────────────────────

	_mountEditor(pHost)
	{
		let tmpRec = this._state.editing || {
			Hash: '', Scope: this._API.getScope(),
			Name: '', Description: '',
			SourceBeaconName: '', SourceConnectionHash: '',
			TargetBeaconName: '', TargetConnectionHash: '',
			Tables: '*'
		};
		let tmpIsNew = !(tmpRec && tmpRec.IDCloneConfig);

		let tmpTablesText = tmpRec.Tables;
		if (Array.isArray(tmpTablesText)) tmpTablesText = JSON.stringify(tmpTablesText);
		else if (typeof tmpTablesText === 'string') {
			// If it's stored as a JSON array string, pretty-print as comma list
			try { let arr = JSON.parse(tmpTablesText); if (Array.isArray(arr)) tmpTablesText = arr.join(', '); }
			catch (e) { /* leave as-is */ }
		}
		tmpTablesText = tmpTablesText || '*';

		let tmpWrap = document.createElement('div'); tmpWrap.className = 'psc-editor';
		let tmpHeader = document.createElement('div'); tmpHeader.className = 'psc-editor-header';
		let tmpHeaderTitle = document.createElement('h3');
		tmpHeaderTitle.textContent = tmpIsNew ? 'New clone' : ('Edit clone "' + tmpRec.Hash + '"');
		tmpHeader.appendChild(tmpHeaderTitle);
		tmpWrap.appendChild(tmpHeader);

		let tmpForm = document.createElement('div'); tmpForm.className = 'psc-editor-form';

		let tmpHashLbl = document.createElement('label'); tmpHashLbl.textContent = 'Hash';
		let tmpHashInput = document.createElement('input'); tmpHashInput.type = 'text';
		tmpHashInput.value = tmpRec.Hash || ''; tmpHashInput.placeholder = 'short-identifier';
		if (!tmpIsNew) tmpHashInput.disabled = true;
		tmpForm.appendChild(tmpHashLbl); tmpForm.appendChild(tmpHashInput);

		let tmpScopeLbl = document.createElement('label'); tmpScopeLbl.textContent = 'Scope';
		let tmpScopeInput = document.createElement('input'); tmpScopeInput.type = 'text';
		tmpScopeInput.value = tmpRec.Scope || ''; tmpScopeInput.placeholder = '(empty = global)';
		tmpForm.appendChild(tmpScopeLbl); tmpForm.appendChild(tmpScopeInput);

		let tmpNameLbl = document.createElement('label'); tmpNameLbl.textContent = 'Name';
		let tmpNameInput = document.createElement('input'); tmpNameInput.type = 'text';
		tmpNameInput.value = tmpRec.Name || ''; tmpNameInput.placeholder = 'Human-readable name';
		tmpForm.appendChild(tmpNameLbl); tmpForm.appendChild(tmpNameInput);

		let tmpDescLbl = document.createElement('label'); tmpDescLbl.textContent = 'Description';
		let tmpDescInput = document.createElement('input'); tmpDescInput.type = 'text';
		tmpDescInput.value = tmpRec.Description || '';
		tmpForm.appendChild(tmpDescLbl); tmpForm.appendChild(tmpDescInput);

		// Source / Target
		let tmpSTLbl = document.createElement('label'); tmpSTLbl.textContent = 'Source ↔ Target';
		let tmpST = document.createElement('div'); tmpST.className = 'psc-source-target';
		let tmpSrc = this._buildSTSection('Source',
			['SourceBeaconName', 'SourceConnectionHash'],
			['Beacon', 'Connection'],
			[tmpRec.SourceBeaconName, tmpRec.SourceConnectionHash]);
		let tmpTgt = this._buildSTSection('Target',
			['TargetBeaconName', 'TargetConnectionHash'],
			['Beacon', 'Connection'],
			[tmpRec.TargetBeaconName, tmpRec.TargetConnectionHash]);
		tmpST.appendChild(tmpSrc.section); tmpST.appendChild(tmpTgt.section);
		tmpForm.appendChild(tmpSTLbl); tmpForm.appendChild(tmpST);

		// Tables
		let tmpTablesLbl = document.createElement('label'); tmpTablesLbl.textContent = 'Tables';
		let tmpTablesWrap = document.createElement('div');
		let tmpTablesInput = document.createElement('textarea');
		tmpTablesInput.spellcheck = false;
		tmpTablesInput.value = tmpTablesText;
		let tmpTablesHelp = document.createElement('div');
		tmpTablesHelp.className = 'psc-help';
		tmpTablesHelp.textContent = 'Comma- or newline-separated list of table names. Use * for "all tables on the source connection" (server resolves at run time).';
		tmpTablesWrap.appendChild(tmpTablesInput); tmpTablesWrap.appendChild(tmpTablesHelp);
		tmpForm.appendChild(tmpTablesLbl); tmpForm.appendChild(tmpTablesWrap);

		tmpWrap.appendChild(tmpForm);

		let tmpErrBox = document.createElement('div');
		tmpErrBox.className = 'psc-editor-error'; tmpErrBox.style.display = 'none';
		tmpWrap.appendChild(tmpErrBox);

		let tmpActions = document.createElement('div'); tmpActions.className = 'psc-editor-actions';
		let tmpCancel = document.createElement('a');
		tmpCancel.className = 'psc-btn'; tmpCancel.textContent = 'Cancel';
		tmpCancel.href = 'javascript:void(0)'; tmpCancel.onclick = () => this.openList();
		tmpActions.appendChild(tmpCancel);
		let tmpSave = document.createElement('a');
		tmpSave.className = 'psc-btn psc-btn-primary';
		tmpSave.textContent = tmpIsNew ? 'Create clone' : 'Save changes';
		tmpSave.href = 'javascript:void(0)';
		tmpSave.onclick = () =>
		{
			let tmpHash = tmpHashInput.value.trim();
			if (!tmpHash) { this._showEditorError(tmpErrBox, 'Hash is required.'); return; }
			let tmpTablesRaw = (tmpTablesInput.value || '').trim();
			let tmpTablesValue;
			if (!tmpTablesRaw || tmpTablesRaw === '*') tmpTablesValue = '*';
			else
			{
				// Comma- or newline-separated → JSON array
				let tmpList = tmpTablesRaw.split(/[\s,]+/).map((s) => s.trim()).filter((s) => s.length > 0);
				tmpTablesValue = JSON.stringify(tmpList);
			}
			let tmpRecord = {
				Hash:                  tmpHash,
				Scope:                 tmpScopeInput.value.trim(),
				Name:                  tmpNameInput.value,
				Description:           tmpDescInput.value,
				SourceBeaconName:      tmpSrc.values()[0],
				SourceConnectionHash:  tmpSrc.values()[1],
				TargetBeaconName:      tmpTgt.values()[0],
				TargetConnectionHash:  tmpTgt.values()[1],
				Tables:                tmpTablesValue
			};
			if (!tmpIsNew && tmpRec.IDCloneConfig) tmpRecord.IDCloneConfig = tmpRec.IDCloneConfig;

			tmpSave.textContent = 'Saving…';
			this._API.saveClone(tmpRecord).then(() =>
			{
				this._toast(tmpIsNew ? 'Clone created.' : 'Clone saved.', 'success');
				this.openList();
			}).catch((pErr) =>
			{
				tmpSave.textContent = tmpIsNew ? 'Create clone' : 'Save changes';
				this._showEditorError(tmpErrBox, pErr.message);
			});
		};
		tmpActions.appendChild(tmpSave);
		tmpWrap.appendChild(tmpActions);

		pHost.appendChild(tmpWrap);
	}

	_buildSTSection(pTitle, pFieldNames, pLabels, pValues)
	{
		let tmpSection = document.createElement('div'); tmpSection.className = 'psc-st-section';
		let tmpHead = document.createElement('h4'); tmpHead.textContent = pTitle;
		tmpSection.appendChild(tmpHead);
		let tmpInputs = [];
		for (let i = 0; i < pFieldNames.length; i++)
		{
			let tmpRow = document.createElement('div'); tmpRow.className = 'psc-st-row';
			let tmpLabel = document.createElement('label'); tmpLabel.textContent = pLabels[i];
			let tmpInput = document.createElement('input'); tmpInput.type = 'text';
			tmpInput.value = pValues[i] || '';
			tmpInput.placeholder = pFieldNames[i];
			tmpRow.appendChild(tmpLabel); tmpRow.appendChild(tmpInput);
			tmpSection.appendChild(tmpRow);
			tmpInputs.push(tmpInput);
		}
		return { section: tmpSection, values: () => tmpInputs.map((i) => i.value.trim()) };
	}

	_showEditorError(pBox, pMsg) { pBox.textContent = pMsg; pBox.style.display = ''; }
}

PictSectionClone.default_configuration = Object.assign({}, libDefaultConf,
	{
		Templates: [{ Hash: 'Pict-Section-Clone-Shell', Template: '<div class="psc-shell-anchor"></div>' }],
		Renderables: [{ RenderableHash: 'Pict-Section-Clone-Shell', TemplateHash: 'Pict-Section-Clone-Shell',
			ContentDestinationAddress: libDefaultConf.DefaultDestinationAddress }]
	});

module.exports = PictSectionClone;
module.exports.default_configuration = PictSectionClone.default_configuration;
module.exports.APIProvider = libAPIProvider;
