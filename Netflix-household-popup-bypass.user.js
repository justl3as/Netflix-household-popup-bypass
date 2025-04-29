// ==UserScript==
// @name           Netflix-Household-Popup-Bypass
// @namespace      http://tampermonkey.net/
// @version        1.0
// @description    Netflix household verification popups bypass.
// @author         justl3as
// @match          https://www.netflix.com/*
// @icon           https://www.google.com/s2/favicons?sz=64&domain=netflix.com
// @updateURL      https://github.com/justl3as/Netflix-household-popup-bypass/raw/refs/heads/main/Netflix-household-popup-bypass.user.js
// @downloadURL    https://github.com/justl3as/Netflix-household-popup-bypass/raw/refs/heads/main/Netflix-household-popup-bypass.user.js
// @run-at         document-start
// @grant          none
// ==/UserScript==

(function() {
    'use strict';

    // Core configuration
    const config = {
        targetOps: ['CLCSInterstitialPlaybackAndPostPlayback'],
        delayMs: 10000,
        selector: '[data-no-focus-lock="true"]'
    };

    // Simple logger
    const log = (action, message) => {
        console.info(`🎬 Netflix Bypass [${action}]: ${message}`);
    };

    // Initialize components based on current page state
    const init = () => {
        log('INIT', 'Starting script initialization');

        // Set up element removal observer
        const observer = new MutationObserver(() => {
            const elements = document.querySelectorAll(config.selector);
            if (elements.length > 0) {
                elements.forEach(el => {
                    el.remove();
                });
                log('REMOVE', `Removed ${elements.length} focus lock element(s)`);
            }
        });

        observer.observe(document.body || document.documentElement, {
            childList: true,
            attributes: true,
            attributeFilter: ['data-no-focus-lock']
        });
        log('OBSERVER', 'Mutation observer activated');

        // Only hook fetch if needed
        if (!document.querySelector(config.selector)) {
            const origFetch = window.fetch;

            window.fetch = async (input, init = {}) => {
                const url = input instanceof Request ? input.url : input;
                const method = init.method || (input instanceof Request ? input.method : 'GET');
                const body = init.body || (input instanceof Request ? input.body : null);

                // Delay matching GraphQL operations
                if (method === 'POST' && url.includes('/graphql') && body) {
                    const bodyText = typeof body === 'string' ? body : JSON.stringify(body);

                    for (const op of config.targetOps) {
                        if (bodyText.includes(op)) {
                            log('DELAY', `Delaying operation "${op}" for ${config.delayMs/1000}s`);
                            await new Promise(resolve => setTimeout(resolve, config.delayMs));
                            break;
                        }
                    }
                }

                return origFetch.call(window, input, init);
            };
            log('FETCH', 'Fetch interceptor installed');
        }
        log('COMPLETE', 'Netflix Bypass fully initialized');
    };

    // Wait for DOM or initialize immediately
    if (document.readyState === 'loading') {
        log('STATUS', 'Document still loading, waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
