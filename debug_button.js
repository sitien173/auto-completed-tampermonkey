// ==UserScript==
// @name         DebugButton
// @version      1.0.0
// @description  add debug button to navigate to adminportal
// @author       https://github.com/sitien173
// @match        *://*/eidv/personMatch*
// @match        *://*/verification*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @downloadURL https://update.greasyfork.org/scripts/546750/AutoComplete.user.js
// @updateURL https://update.greasyfork.org/scripts/546750/AutoComplete.meta.js
// ==/UserScript==
/* eslint-disable */
/* global GM_getValue, GM_setValue */

(function() {
    'use strict';

    function fetchDebugAddress() {
        try {
            const stored = GM_getValue('debugAddress', null);
            if (!stored) {
                return null;
            }
            try {
                const url = new URL(stored);
                return url.origin;
            } catch (e) {
                return null;
            }
        } catch (e) {
            return null;
        }
    }

    function fetchIsButtonVisibleFlag() {
        try {
            const flag = GM_getValue('isButtonVisible', true);
            return Boolean(flag);
        } catch (e) {
            return true;
        }
    }

    function goToDebug(transactionRecordID, ctrlKeyPressed) {
        let domainString = fetchDebugAddress();
        const host = window.location.host;

        if (!domainString) {
            domainString = 'https://localhost:44331';
            if (host.includes('staging')) {
                domainString = 'https://test-adminportal-us.staging.trulioo.com';
            } else if (host.includes('trulioo')) {
                domainString = 'https://adminportal.us.qa.trulioo.com';
            } else if (!host.includes('localhost')) {
                // Derive from current domain
                let derived = window.location.origin;
                derived = derived.replace('portal', 'adminportal');
                derived = derived.replace('44333', '44331');
                domainString = derived;
            }
        }

        if (transactionRecordID) {
            const url = `${domainString}/GDCDebug/DebugRecordTransaction?transactionRecordID=${encodeURIComponent(transactionRecordID)}`;
            window.open(url, ctrlKeyPressed ? '_blank' : 'trulioo');
        }
    }

    function getCurrentPageTransactionId() {
        const urlParams = new URLSearchParams(window.location.search);
        const fromIcon = document.getElementsByClassName('file-icon')[0]?.parentNode?.textContent?.trim();
        const fromValue = document.getElementsByClassName('value fs-exclude')[5]?.innerText;
        return fromIcon || fromValue || urlParams.get('transactionRecordId');
    }

    function ensureMainButtonVisibility() {
        const isVisible = fetchIsButtonVisibleFlag();
        const existing = document.getElementById('mainDebugButton');
        if (isVisible && !existing) {
            // Trigger insertion routine by calling DOMContentLoaded handler logic fragment
            try {
                insertMainButtons();
            } catch (e) {
                // no-op
            }
        } else if (!isVisible && existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }
    }

    function buildSettingsOverlay() {
        const existing = document.getElementById('auto-settings-overlay');
        if (existing) {
            existing.remove();
        }

        const overlay = document.createElement('div');
        overlay.id = 'auto-settings-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '99999';
        overlay.addEventListener('click', function() { overlay.remove(); });

        const modal = document.createElement('div');
        modal.style.position = 'absolute';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.background = '#fff';
        modal.style.borderRadius = '8px';
        modal.style.minWidth = '320px';
        modal.style.maxWidth = '480px';
        modal.style.padding = '16px';
        modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
        modal.addEventListener('click', function(e) { e.stopPropagation(); });

        const title = document.createElement('div');
        title.textContent = 'AutoCompleted Settings';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '12px';

        const fieldDebug = document.createElement('div');
        fieldDebug.style.marginBottom = '8px';
        const labelDebug = document.createElement('label');
        labelDebug.textContent = 'Debug Address';
        labelDebug.style.display = 'block';
        labelDebug.style.marginBottom = '4px';
        const inputDebug = document.createElement('input');
        inputDebug.type = 'text';
        inputDebug.id = 'auto-setting-debugAddress';
        inputDebug.style.width = '100%';
        inputDebug.style.boxSizing = 'border-box';
        inputDebug.value = GM_getValue('debugAddress', '') || '';
        fieldDebug.appendChild(labelDebug);
        fieldDebug.appendChild(inputDebug);

        const fieldVisible = document.createElement('div');
        fieldVisible.style.marginBottom = '8px';
        const labelVisible = document.createElement('label');
        labelVisible.style.display = 'inline-flex';
        labelVisible.style.alignItems = 'center';
        const inputVisible = document.createElement('input');
        inputVisible.type = 'checkbox';
        inputVisible.id = 'auto-setting-isButtonVisible';
        inputVisible.checked = Boolean(GM_getValue('isButtonVisible', true));
        const spanVisible = document.createElement('span');
        spanVisible.textContent = ' Show Debug Button';
        labelVisible.appendChild(inputVisible);
        labelVisible.appendChild(spanVisible);
        fieldVisible.appendChild(labelVisible);

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';
        actions.style.gap = '8px';
        actions.style.marginTop = '12px';
        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'Close';
        btnCancel.addEventListener('click', function() { overlay.remove(); });
        const btnSave = document.createElement('button');
        btnSave.textContent = 'Save';
        btnSave.style.background = '#2563eb';
        btnSave.style.color = '#fff';
        btnSave.style.border = 'none';
        btnSave.style.padding = '6px 12px';
        btnSave.style.borderRadius = '4px';
        btnSave.addEventListener('click', function() {
            const addr = document.getElementById('auto-setting-debugAddress').value.trim();
            const vis = document.getElementById('auto-setting-isButtonVisible').checked;
            if (addr) {
                GM_setValue('debugAddress', addr);
            } else {
                GM_setValue('debugAddress', '');
            }
            GM_setValue('isButtonVisible', Boolean(vis));
            ensureMainButtonVisibility();
            overlay.remove();
        });

        actions.appendChild(btnCancel);
        actions.appendChild(btnSave);

        modal.appendChild(title);
        modal.appendChild(fieldDebug);
        modal.appendChild(fieldVisible);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function openSettingsOverlay() {
        buildSettingsOverlay();
    }

    function createFloatingSettingsButton() {
        let floating = document.getElementById('auto-floating-settings');
        if (floating) {
            return;
        }
        floating = document.createElement('button');
        floating.id = 'auto-floating-settings';
        floating.type = 'button';
        floating.textContent = '⚙️';
        floating.title = 'Settings (Ctrl+Shift+Q)';
        floating.style.position = 'fixed';
        floating.style.right = '12px';
        floating.style.bottom = '12px';
        floating.style.zIndex = '100000';
        floating.style.width = '36px';
        floating.style.height = '36px';
        floating.style.borderRadius = '18px';
        floating.style.background = '#ffffff';
        floating.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        floating.style.cursor = 'pointer';
        floating.addEventListener('click', function() { openSettingsOverlay(); });
        document.body.appendChild(floating);
    }

    document.addEventListener('keydown', function(e) {
        let consumed = false;

        if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
            if (e.code === 'KeyD') {
                const transactionRecordID = getCurrentPageTransactionId();
                goToDebug(transactionRecordID, e.ctrlKey);
                consumed = true;
            } else if (e.code === 'KeyQ') {
                openSettingsOverlay();
                consumed = true;
            }
        }

        if (e.code === 'F1') {
            const transactionRecordID = getCurrentPageTransactionId();
            goToDebug(transactionRecordID, e.ctrlKey);
            consumed = true;
        }

        if (consumed) {
            e.stopPropagation();
            e.preventDefault();
        }
    });

    function insertMainButtons() {
        const isButtonVisible = fetchIsButtonVisibleFlag();
        if (!isButtonVisible) {
            return;
        }
        const existing = document.getElementById('mainDebugButton');
        if (!existing) {
            const mainBtn = document.createElement('button');
            mainBtn.id = 'mainDebugButton';
            mainBtn.type = 'button';
            mainBtn.className = 'btn btn-primary';
            mainBtn.textContent = 'Debug (F1)';
            mainBtn.style.alignItems = 'center';
            mainBtn.style.height = '30px';
            mainBtn.style.padding = '0px 10px';
            mainBtn.addEventListener('click', function(event) {
                const transactionRecordID = getCurrentPageTransactionId();
                goToDebug(transactionRecordID, event.ctrlKey);
            });

            const settingsBtn = document.createElement('button');
            settingsBtn.id = 'mainSettingsButton';
            settingsBtn.type = 'button';
            settingsBtn.textContent = '⚙️';
            settingsBtn.title = 'Settings (Ctrl+Shift+Q)';
            settingsBtn.style.marginLeft = '6px';
            settingsBtn.style.height = '30px';
            settingsBtn.style.padding = '0 8px';
            settingsBtn.addEventListener('click', function() { openSettingsOverlay(); });

            let supportLink = document.querySelector('.atlas-box.atlas-get-support-box.help a');
            if (supportLink && supportLink.parentNode) {
                supportLink.parentNode.replaceChild(mainBtn, supportLink);
                mainBtn.insertAdjacentElement('afterend', settingsBtn);
            } else {
                const container = document.querySelector('#main-content-div > div.d-print-none.atlas_nav_menu > div > div');
                if (container && container.innerText === 'Verification') {
                    container.insertAdjacentElement('beforeend', mainBtn);
                    mainBtn.insertAdjacentElement('afterend', settingsBtn);
                }
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        insertMainButtons();
        createFloatingSettingsButton();

        const target = document.getElementsByClassName('transaction-page')[0];
        if (target) {
            const observer = new MutationObserver(function() {
                const resultsTable = document.querySelector('#content > div > div.section.search-results > table');
                if (resultsTable) {
                    for (const row of resultsTable.rows) {
                        if (row.rowIndex === 0) {
                            continue;
                        }
                        // Avoid adding multiple buttons
                        const alreadyHas = row.querySelector('.btn.btn-primary.__auto_debug_btn');
                        if (alreadyHas) {
                            continue;
                        }
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'btn btn-primary __auto_debug_btn';
                        button.textContent = 'Debug';
                        button.addEventListener('click', function(event) {
                            const transactionRecordID = row.cells[4]?.firstChild?.textContent;
                            goToDebug(transactionRecordID, event.ctrlKey);
                        });
                        if (row.cells[4]) {
                            row.cells[4].insertAdjacentElement('beforeend', button);
                        }
                    }
                }
            });
            observer.observe(target, { childList: true, subtree: true });
        }
    });
})();
