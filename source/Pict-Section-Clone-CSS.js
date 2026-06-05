/**
 * Pict-Section-Clone CSS — `psc-` prefixed.
 */
'use strict';

module.exports = `
.psc-root
{
	--psc-bg:           #0e1a2b;
	--psc-bg-elev:      #0a1525;
	--psc-bg-elev-2:    #0f172a;
	--psc-border:       #1e293b;
	--psc-fg:           #f8fafc;
	--psc-fg-soft:      #cbd5e1;
	--psc-fg-mute:      #94a3b8;
	--psc-fg-fade:      #64748b;
	--psc-accent:       #2563eb;
	--psc-accent-fg:    #ffffff;
	--psc-success:      #16a34a;
	--psc-success-fg:   #dcfce7;
	--psc-danger:       #b91c1c;
	--psc-danger-fg:    #fecaca;

	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	background: var(--psc-bg);
	color: var(--psc-fg);
	min-height: 100%;
}

.psc-toolbar
{
	display: flex; align-items: center; gap: 12px;
	padding: 10px 16px; background: var(--psc-bg-elev);
	border-bottom: 1px solid var(--psc-border); flex-wrap: wrap;
}
.psc-toolbar h2 { margin: 0; font-size: 16px; font-weight: 600; }
.psc-toolbar .psc-toolbar-spacer { flex: 1; }
.psc-toolbar label { color: var(--psc-fg-mute); font-size: 12px; display: inline-flex; align-items: center; gap: 6px; }
.psc-toolbar input
{
	background: var(--psc-bg-elev-2); color: var(--psc-fg);
	border: 1px solid var(--psc-border); padding: 5px 9px; border-radius: 4px;
	font-size: 12px; font-family: inherit;
}
.psc-toolbar input.psc-scope-input { width: 140px; font-family: monospace; }
.psc-toolbar .psc-scope-hint { color: var(--psc-fg-fade); font-size: 11px; font-style: italic; }
.psc-btn
{
	background: var(--psc-bg-elev-2); color: var(--psc-fg-soft);
	border: 1px solid var(--psc-border); padding: 5px 11px; border-radius: 4px;
	font-size: 12px; cursor: pointer; text-decoration: none;
	display: inline-flex; align-items: center; gap: 4px;
}
.psc-btn:hover { background: #1e293b; color: var(--psc-fg); }
.psc-btn.psc-btn-primary { background: var(--psc-accent); border-color: var(--psc-accent); color: var(--psc-accent-fg); }
.psc-btn.psc-btn-primary:hover { background: #1d4ed8; }
.psc-btn.psc-btn-success { background: var(--psc-success); border-color: var(--psc-success); color: var(--psc-success-fg); }
.psc-btn.psc-btn-success:hover { background: #15803d; }
.psc-btn.psc-btn-danger { background: transparent; color: var(--psc-danger-fg); border-color: var(--psc-danger); }
.psc-btn.psc-btn-danger:hover { background: var(--psc-danger); color: var(--psc-accent-fg); }
.psc-btn[disabled], .psc-btn.psc-btn-disabled { opacity: 0.5; pointer-events: none; }

.psc-content { padding: 16px; max-width: 1400px; margin: 0 auto; }

/* List */
.psc-list { display: flex; flex-direction: column; gap: 8px; }
.psc-list-row
{
	display: grid; grid-template-columns: 1.4fr 1.6fr 2fr auto;
	gap: 12px; padding: 10px 14px; align-items: center;
	background: var(--psc-bg-elev); border: 1px solid var(--psc-border); border-radius: 6px;
}
.psc-list-row .psc-row-hash { font-family: monospace; font-size: 13px; color: var(--psc-fg); font-weight: 600; }
.psc-list-row .psc-row-hash .psc-row-scope { color: var(--psc-fg-fade); font-style: italic; font-weight: 400; margin-left: 6px; font-size: 11px; }
.psc-list-row .psc-row-name { color: var(--psc-fg-soft); font-size: 13px; }
.psc-list-row .psc-row-flow { font-size: 11px; color: var(--psc-fg-mute); font-family: monospace; }
.psc-list-row .psc-row-tables { font-size: 11px; color: var(--psc-fg-mute); margin-top: 3px; font-style: italic; }
.psc-list-row .psc-row-actions { display: flex; gap: 6px; justify-content: flex-end; }

.psc-empty, .psc-error
{
	padding: 18px; text-align: center;
	color: var(--psc-fg-fade); font-size: 13px;
	border: 1px dashed var(--psc-border); border-radius: 6px; background: var(--psc-bg-elev);
}
.psc-error { color: #f87171; background: #2a1010; border-color: #2a1010; }

/* Editor */
.psc-editor { display: flex; flex-direction: column; gap: 14px; }
.psc-editor-header h3 { margin: 0; font-size: 16px; }
.psc-editor-form { display: grid; grid-template-columns: 160px 1fr; gap: 10px 14px; align-items: center; }
.psc-editor-form label { color: var(--psc-fg-mute); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.psc-editor-form input[type=text], .psc-editor-form textarea
{
	background: var(--psc-bg-elev-2); color: var(--psc-fg);
	border: 1px solid var(--psc-border); padding: 6px 10px; border-radius: 4px;
	font-size: 13px; font-family: inherit;
}
.psc-editor-form textarea { font-family: monospace; min-height: 90px; resize: vertical; width: 100%; box-sizing: border-box; font-size: 12px; }
.psc-editor-form .psc-help { color: var(--psc-fg-fade); font-size: 11px; font-style: italic; }
.psc-editor-actions { display: flex; gap: 8px; justify-content: flex-end; }
.psc-editor-error { color: #f87171; font-size: 12px; padding: 8px 12px; background: #2a1010; border-radius: 4px; }
.psc-source-target
{
	display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 12px;
	background: var(--psc-bg-elev-2); border: 1px solid var(--psc-border); border-radius: 4px;
}
.psc-source-target .psc-st-section h4 { margin: 0 0 8px 0; color: var(--psc-fg-mute); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
.psc-source-target .psc-st-row { display: grid; grid-template-columns: 90px 1fr; gap: 6px; margin-bottom: 6px; align-items: center; }
.psc-source-target .psc-st-row label { color: var(--psc-fg-fade); font-size: 11px; }

/* Run result */
.psc-run-result
{
	padding: 14px; background: var(--psc-bg-elev);
	border: 1px solid var(--psc-border); border-radius: 6px; margin-top: 10px;
	font-size: 13px; display: flex; flex-direction: column; gap: 8px;
}
.psc-run-result h4 { margin: 0; font-size: 14px; color: var(--psc-fg-soft); }
.psc-run-result .psc-run-stats { display: flex; gap: 18px; flex-wrap: wrap; }
.psc-run-result .psc-run-stat { display: flex; flex-direction: column; }
.psc-run-result .psc-run-stat .psc-stat-label { font-size: 10px; color: var(--psc-fg-mute); text-transform: uppercase; letter-spacing: 0.5px; }
.psc-run-result .psc-run-stat .psc-stat-value { font-size: 16px; color: var(--psc-fg); font-family: monospace; font-weight: 600; }
.psc-run-result .psc-run-tables { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; font-size: 12px; color: var(--psc-fg-soft); font-family: monospace; }
.psc-run-result .psc-run-table-line { display: flex; gap: 8px; }
.psc-run-result .psc-run-table-line .psc-tname { font-weight: 600; min-width: 200px; }
.psc-run-result.psc-run-success { border-color: var(--psc-success); }
.psc-run-result.psc-run-error   { border-color: var(--psc-danger); }
`;
