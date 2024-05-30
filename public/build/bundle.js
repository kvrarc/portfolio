
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Nav.svelte generated by Svelte v3.59.2 */

    const file$6 = "src/components/Nav.svelte";

    function create_fragment$7(ctx) {
    	let nav0;
    	let div0;
    	let t1;
    	let div1;
    	let ul;
    	let li0;
    	let a0;
    	let t3;
    	let li1;
    	let a1;
    	let t5;
    	let li2;
    	let a2;
    	let t7;
    	let li3;
    	let a3;
    	let t9;
    	let nav1;
    	let div2;
    	let t11;
    	let div5;
    	let div3;
    	let span0;
    	let t12;
    	let span1;
    	let t13;
    	let span2;
    	let t14;
    	let div4;
    	let li4;
    	let a4;
    	let t16;
    	let li5;
    	let a5;
    	let t18;
    	let li6;
    	let a6;
    	let t20;
    	let li7;
    	let a7;

    	const block = {
    		c: function create() {
    			nav0 = element("nav");
    			div0 = element("div");
    			div0.textContent = "👋🏼";
    			t1 = space();
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "About";
    			t3 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Experience";
    			t5 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Projects";
    			t7 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Contact";
    			t9 = space();
    			nav1 = element("nav");
    			div2 = element("div");
    			div2.textContent = "👋🏼";
    			t11 = space();
    			div5 = element("div");
    			div3 = element("div");
    			span0 = element("span");
    			t12 = space();
    			span1 = element("span");
    			t13 = space();
    			span2 = element("span");
    			t14 = space();
    			div4 = element("div");
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "About";
    			t16 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "Experience";
    			t18 = space();
    			li6 = element("li");
    			a6 = element("a");
    			a6.textContent = "Projects";
    			t20 = space();
    			li7 = element("li");
    			a7 = element("a");
    			a7.textContent = "Contact";
    			attr_dev(div0, "class", "logo");
    			add_location(div0, file$6, 1, 2, 25);
    			attr_dev(a0, "href", "#about");
    			add_location(a0, file$6, 4, 10, 99);
    			add_location(li0, file$6, 4, 6, 95);
    			attr_dev(a1, "href", "#experience");
    			add_location(a1, file$6, 5, 10, 141);
    			add_location(li1, file$6, 5, 6, 137);
    			attr_dev(a2, "href", "#projects");
    			add_location(a2, file$6, 6, 10, 193);
    			add_location(li2, file$6, 6, 6, 189);
    			attr_dev(a3, "href", "#contact");
    			add_location(a3, file$6, 7, 10, 241);
    			add_location(li3, file$6, 7, 6, 237);
    			attr_dev(ul, "class", "nav-links");
    			add_location(ul, file$6, 3, 4, 66);
    			add_location(div1, file$6, 2, 2, 56);
    			attr_dev(nav0, "id", "desktop-nav");
    			add_location(nav0, file$6, 0, 0, 0);
    			attr_dev(div2, "class", "logo");
    			add_location(div2, file$6, 12, 2, 330);
    			add_location(span0, file$6, 15, 6, 452);
    			add_location(span1, file$6, 16, 6, 472);
    			add_location(span2, file$6, 17, 6, 492);
    			attr_dev(div3, "class", "hamburger-icon");
    			attr_dev(div3, "onclick", "toggleMenu()");
    			add_location(div3, file$6, 14, 4, 394);
    			attr_dev(a4, "href", "#about");
    			attr_dev(a4, "onclick", "toggleMenu()");
    			add_location(a4, file$6, 20, 10, 556);
    			add_location(li4, file$6, 20, 6, 552);
    			attr_dev(a5, "href", "#experience");
    			attr_dev(a5, "onclick", "toggleMenu()");
    			add_location(a5, file$6, 21, 10, 621);
    			add_location(li5, file$6, 21, 6, 617);
    			attr_dev(a6, "href", "#projects");
    			attr_dev(a6, "onclick", "toggleMenu()");
    			add_location(a6, file$6, 22, 10, 696);
    			add_location(li6, file$6, 22, 6, 692);
    			attr_dev(a7, "href", "#contact");
    			attr_dev(a7, "onclick", "toggleMenu()");
    			add_location(a7, file$6, 23, 10, 767);
    			add_location(li7, file$6, 23, 6, 763);
    			attr_dev(div4, "class", "menu-links");
    			add_location(div4, file$6, 19, 4, 521);
    			attr_dev(div5, "class", "hamburger-menu");
    			add_location(div5, file$6, 13, 2, 361);
    			attr_dev(nav1, "id", "hamburger-nav");
    			add_location(nav1, file$6, 11, 0, 303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav0, anchor);
    			append_dev(nav0, div0);
    			append_dev(nav0, t1);
    			append_dev(nav0, div1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t7);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, nav1, anchor);
    			append_dev(nav1, div2);
    			append_dev(nav1, t11);
    			append_dev(nav1, div5);
    			append_dev(div5, div3);
    			append_dev(div3, span0);
    			append_dev(div3, t12);
    			append_dev(div3, span1);
    			append_dev(div3, t13);
    			append_dev(div3, span2);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			append_dev(div4, li4);
    			append_dev(li4, a4);
    			append_dev(div4, t16);
    			append_dev(div4, li5);
    			append_dev(li5, a5);
    			append_dev(div4, t18);
    			append_dev(div4, li6);
    			append_dev(li6, a6);
    			append_dev(div4, t20);
    			append_dev(div4, li7);
    			append_dev(li7, a7);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(nav1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Nav', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Profile.svelte generated by Svelte v3.59.2 */

    const file$5 = "src/components/Profile.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div3;
    	let p0;
    	let t2;
    	let h1;
    	let t4;
    	let p1;
    	let t6;
    	let div1;
    	let button0;
    	let t8;
    	let button1;
    	let t10;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t11;
    	let img2;
    	let img2_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div3 = element("div");
    			p0 = element("p");
    			p0.textContent = "Hello, I'm";
    			t2 = space();
    			h1 = element("h1");
    			h1.textContent = "Kaku";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "iOS & Android Developer";
    			t6 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Download CV";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Contact Info";
    			t10 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t11 = space();
    			img2 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/profile.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Kaku profile picture");
    			add_location(img0, file$5, 3, 8, 128);
    			attr_dev(div0, "class", "section__pic-container");
    			add_location(div0, file$5, 1, 6, 29);
    			attr_dev(p0, "class", "section__text__p1");
    			add_location(p0, file$5, 6, 8, 245);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$5, 7, 8, 297);
    			attr_dev(p1, "class", "section__text__p2");
    			add_location(p1, file$5, 8, 8, 333);
    			attr_dev(button0, "class", "btn btn-color-2");
    			attr_dev(button0, "onclick", "");
    			add_location(button0, file$5, 10, 10, 436);
    			attr_dev(button1, "class", "btn btn-color-1");
    			attr_dev(button1, "onclick", "location.href='./#contact'");
    			add_location(button1, file$5, 16, 10, 569);
    			attr_dev(div1, "class", "btn-container");
    			add_location(div1, file$5, 9, 8, 398);
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/linkedin.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "My LinkedIn profile");
    			attr_dev(img1, "class", "icon");
    			attr_dev(img1, "onclick", "window.open('https://linkedin.com/in/itsjustoku', '_blank')");
    			add_location(img1, file$5, 21, 10, 746);
    			if (!src_url_equal(img2.src, img2_src_value = "./assets/github.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "My Github profile");
    			attr_dev(img2, "class", "icon");
    			attr_dev(img2, "onclick", "window.open('https://github.com/kvrarc', '_blank')");
    			add_location(img2, file$5, 27, 10, 959);
    			attr_dev(div2, "id", "socials-container");
    			add_location(div2, file$5, 20, 8, 707);
    			attr_dev(div3, "class", "section__text");
    			add_location(div3, file$5, 5, 6, 209);
    			attr_dev(section, "id", "profile");
    			add_location(section, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, img0);
    			append_dev(section, t0);
    			append_dev(section, div3);
    			append_dev(div3, p0);
    			append_dev(div3, t2);
    			append_dev(div3, h1);
    			append_dev(div3, t4);
    			append_dev(div3, p1);
    			append_dev(div3, t6);
    			append_dev(div3, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t8);
    			append_dev(div1, button1);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div2, t11);
    			append_dev(div2, img2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Profile', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Profile> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Profile",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/About.svelte generated by Svelte v3.59.2 */

    const file$4 = "src/components/About.svelte";

    function create_fragment$5(ctx) {
    	let section;
    	let p0;
    	let t1;
    	let h1;
    	let t3;
    	let div6;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let div5;
    	let div3;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let h30;
    	let t7;
    	let p1;
    	let t8;
    	let br;
    	let t9;
    	let t10;
    	let div2;
    	let img2;
    	let img2_src_value;
    	let t11;
    	let h31;
    	let t13;
    	let p2;
    	let t15;
    	let div4;
    	let p3;
    	let t17;
    	let img3;
    	let img3_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			p0 = element("p");
    			p0.textContent = "Get To Know More";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "About Me";
    			t3 = space();
    			div6 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			img1 = element("img");
    			t5 = space();
    			h30 = element("h3");
    			h30.textContent = "Experience";
    			t7 = space();
    			p1 = element("p");
    			t8 = text("2+ years ");
    			br = element("br");
    			t9 = text("Mobile App Development");
    			t10 = space();
    			div2 = element("div");
    			img2 = element("img");
    			t11 = space();
    			h31 = element("h3");
    			h31.textContent = "Education";
    			t13 = space();
    			p2 = element("p");
    			p2.textContent = "Bachelor of Computer Applications";
    			t15 = space();
    			div4 = element("div");
    			p3 = element("p");
    			p3.textContent = "Hey there! I'm Kaku Moni Baruah, a software developer based in Bangalore, India, with a knack for crafting iOS and Android applications. With extensive experience in iOS frameworks such as UIKit, Core Data, and SwiftUI, I thrive on creating seamless and intuitive user experiences for Apple devices. On the Android side, I'm well-versed in popular frameworks like Android Jetpack, Retrofit, and Dagger, ensuring robust and efficient app development.\n\nBeyond coding, you'll often find me strumming away on my guitar or exploring the great outdoors through hiking and adventures.\n\nThis portfolio is a glimpse into my world of app development and creative pursuits. From sleek mobile interfaces to serene mountain vistas, I'm all about bringing ideas to life, both in the digital realm and beyond.\n\nThanks for stopping by, and feel free to reach out for a chat about apps, music, or anything in between!";
    			t17 = space();
    			img3 = element("img");
    			attr_dev(p0, "class", "section__text__p1");
    			add_location(p0, file$4, 1, 2, 23);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$4, 2, 2, 75);
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/about.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Profile picture");
    			attr_dev(img0, "class", "about-pic");
    			add_location(img0, file$4, 6, 6, 240);
    			attr_dev(div0, "class", "section__pic-container");
    			add_location(div0, file$4, 4, 4, 145);
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/experience.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Experience icon");
    			attr_dev(img1, "class", "icon");
    			add_location(img1, file$4, 15, 10, 483);
    			add_location(h30, file$4, 20, 10, 612);
    			add_location(br, file$4, 21, 22, 654);
    			add_location(p1, file$4, 21, 10, 642);
    			attr_dev(div1, "class", "details-container");
    			add_location(div1, file$4, 14, 8, 441);
    			if (!src_url_equal(img2.src, img2_src_value = "./assets/education.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Education icon");
    			attr_dev(img2, "class", "icon");
    			add_location(img2, file$4, 24, 10, 752);
    			add_location(h31, file$4, 29, 10, 879);
    			add_location(p2, file$4, 30, 10, 908);
    			attr_dev(div2, "class", "details-container");
    			add_location(div2, file$4, 23, 8, 710);
    			attr_dev(div3, "class", "about-containers");
    			add_location(div3, file$4, 13, 6, 402);
    			add_location(p3, file$4, 34, 8, 1020);
    			attr_dev(div4, "class", "text-container");
    			add_location(div4, file$4, 33, 6, 983);
    			attr_dev(div5, "class", "about-details-container");
    			add_location(div5, file$4, 12, 4, 358);
    			attr_dev(div6, "class", "section-container");
    			add_location(div6, file$4, 3, 2, 109);
    			if (!src_url_equal(img3.src, img3_src_value = "./assets/arrow.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Arrow icon");
    			attr_dev(img3, "class", "icon arrow");
    			attr_dev(img3, "onclick", "location.href='./#experience'");
    			add_location(img3, file$4, 46, 2, 1983);
    			attr_dev(section, "id", "about");
    			add_location(section, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, p0);
    			append_dev(section, t1);
    			append_dev(section, h1);
    			append_dev(section, t3);
    			append_dev(section, div6);
    			append_dev(div6, div0);
    			append_dev(div0, img0);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div1, img1);
    			append_dev(div1, t5);
    			append_dev(div1, h30);
    			append_dev(div1, t7);
    			append_dev(div1, p1);
    			append_dev(p1, t8);
    			append_dev(p1, br);
    			append_dev(p1, t9);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, img2);
    			append_dev(div2, t11);
    			append_dev(div2, h31);
    			append_dev(div2, t13);
    			append_dev(div2, p2);
    			append_dev(div5, t15);
    			append_dev(div5, div4);
    			append_dev(div4, p3);
    			append_dev(section, t17);
    			append_dev(section, img3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Experience.svelte generated by Svelte v3.59.2 */

    const file$3 = "src/components/Experience.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let p0;
    	let t1;
    	let h1;
    	let t3;
    	let div15;
    	let div14;
    	let div7;
    	let h20;
    	let t5;
    	let div6;
    	let article0;
    	let img0;
    	let img0_src_value;
    	let t6;
    	let div0;
    	let h30;
    	let t8;
    	let p1;
    	let t10;
    	let article1;
    	let img1;
    	let img1_src_value;
    	let t11;
    	let div1;
    	let h31;
    	let t13;
    	let p2;
    	let t15;
    	let article2;
    	let img2;
    	let img2_src_value;
    	let t16;
    	let div2;
    	let h32;
    	let t18;
    	let p3;
    	let t20;
    	let article3;
    	let img3;
    	let img3_src_value;
    	let t21;
    	let div3;
    	let h33;
    	let t23;
    	let p4;
    	let t25;
    	let article4;
    	let img4;
    	let img4_src_value;
    	let t26;
    	let div4;
    	let h34;
    	let t28;
    	let p5;
    	let t30;
    	let article5;
    	let img5;
    	let img5_src_value;
    	let t31;
    	let div5;
    	let h35;
    	let t33;
    	let p6;
    	let t35;
    	let div13;
    	let h21;
    	let t37;
    	let div12;
    	let article6;
    	let img6;
    	let img6_src_value;
    	let t38;
    	let div8;
    	let h36;
    	let t40;
    	let p7;
    	let t42;
    	let article7;
    	let img7;
    	let img7_src_value;
    	let t43;
    	let div9;
    	let h37;
    	let t45;
    	let p8;
    	let t47;
    	let article8;
    	let img8;
    	let img8_src_value;
    	let t48;
    	let div10;
    	let h38;
    	let t50;
    	let p9;
    	let t52;
    	let article9;
    	let img9;
    	let img9_src_value;
    	let t53;
    	let div11;
    	let h39;
    	let t55;
    	let p10;
    	let t57;
    	let img10;
    	let img10_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			p0 = element("p");
    			p0.textContent = "Explore My";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Experience";
    			t3 = space();
    			div15 = element("div");
    			div14 = element("div");
    			div7 = element("div");
    			h20 = element("h2");
    			h20.textContent = "iOS Development";
    			t5 = space();
    			div6 = element("div");
    			article0 = element("article");
    			img0 = element("img");
    			t6 = space();
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Swift";
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "Intermediate";
    			t10 = space();
    			article1 = element("article");
    			img1 = element("img");
    			t11 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			h31.textContent = "UIKit";
    			t13 = space();
    			p2 = element("p");
    			p2.textContent = "Intermediate";
    			t15 = space();
    			article2 = element("article");
    			img2 = element("img");
    			t16 = space();
    			div2 = element("div");
    			h32 = element("h3");
    			h32.textContent = "SwiftUI";
    			t18 = space();
    			p3 = element("p");
    			p3.textContent = "Intermediate";
    			t20 = space();
    			article3 = element("article");
    			img3 = element("img");
    			t21 = space();
    			div3 = element("div");
    			h33 = element("h3");
    			h33.textContent = "Core Data";
    			t23 = space();
    			p4 = element("p");
    			p4.textContent = "Basic";
    			t25 = space();
    			article4 = element("article");
    			img4 = element("img");
    			t26 = space();
    			div4 = element("div");
    			h34 = element("h3");
    			h34.textContent = "Objective-C";
    			t28 = space();
    			p5 = element("p");
    			p5.textContent = "Basic";
    			t30 = space();
    			article5 = element("article");
    			img5 = element("img");
    			t31 = space();
    			div5 = element("div");
    			h35 = element("h3");
    			h35.textContent = "XCode";
    			t33 = space();
    			p6 = element("p");
    			p6.textContent = "Intermediate";
    			t35 = space();
    			div13 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Android Development";
    			t37 = space();
    			div12 = element("div");
    			article6 = element("article");
    			img6 = element("img");
    			t38 = space();
    			div8 = element("div");
    			h36 = element("h3");
    			h36.textContent = "Jetpack Compose";
    			t40 = space();
    			p7 = element("p");
    			p7.textContent = "Intermediate";
    			t42 = space();
    			article7 = element("article");
    			img7 = element("img");
    			t43 = space();
    			div9 = element("div");
    			h37 = element("h3");
    			h37.textContent = "Kotlin";
    			t45 = space();
    			p8 = element("p");
    			p8.textContent = "Intermediate";
    			t47 = space();
    			article8 = element("article");
    			img8 = element("img");
    			t48 = space();
    			div10 = element("div");
    			h38 = element("h3");
    			h38.textContent = "Firebase & Firestore";
    			t50 = space();
    			p9 = element("p");
    			p9.textContent = "Basic";
    			t52 = space();
    			article9 = element("article");
    			img9 = element("img");
    			t53 = space();
    			div11 = element("div");
    			h39 = element("h3");
    			h39.textContent = "Android Studio";
    			t55 = space();
    			p10 = element("p");
    			p10.textContent = "Intermediate";
    			t57 = space();
    			img10 = element("img");
    			attr_dev(p0, "class", "section__text__p1");
    			add_location(p0, file$3, 1, 2, 28);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$3, 2, 2, 74);
    			attr_dev(h20, "class", "experience-sub-title");
    			add_location(h20, file$3, 6, 8, 234);
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/checkmark.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Experience icon");
    			attr_dev(img0, "class", "icon");
    			add_location(img0, file$3, 9, 12, 360);
    			add_location(h30, file$3, 15, 14, 518);
    			add_location(p1, file$3, 16, 14, 547);
    			add_location(div0, file$3, 14, 12, 498);
    			add_location(article0, file$3, 8, 10, 338);
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/checkmark.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Experience icon");
    			attr_dev(img1, "class", "icon");
    			add_location(img1, file$3, 20, 12, 639);
    			add_location(h31, file$3, 26, 14, 797);
    			add_location(p2, file$3, 27, 14, 826);
    			add_location(div1, file$3, 25, 12, 777);
    			add_location(article1, file$3, 19, 10, 617);
    			if (!src_url_equal(img2.src, img2_src_value = "./assets/checkmark.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Experience icon");
    			attr_dev(img2, "class", "icon");
    			add_location(img2, file$3, 31, 12, 918);
    			add_location(h32, file$3, 37, 14, 1076);
    			add_location(p3, file$3, 38, 14, 1107);
    			add_location(div2, file$3, 36, 12, 1056);
    			add_location(article2, file$3, 30, 10, 896);
    			if (!src_url_equal(img3.src, img3_src_value = "./assets/checkmark.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Experience icon");
    			attr_dev(img3, "class", "icon");
    			add_location(img3, file$3, 42, 12, 1199);
    			add_location(h33, file$3, 48, 14, 1357);
    			add_location(p4, file$3, 49, 14, 1390);
    			add_location(div3, file$3, 47, 12, 1337);
    			add_location(article3, file$3, 41, 10, 1177);
    			if (!src_url_equal(img4.src, img4_src_value = "./assets/checkmark.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "Experience icon");
    			attr_dev(img4, "class", "icon");
    			add_location(img4, file$3, 53, 12, 1475);
    			add_location(h34, file$3, 59, 14, 1633);
    			add_location(p5, file$3, 60, 14, 1668);
    			add_location(div4, file$3, 58, 12, 1613);
    			add_location(article4, file$3, 52, 10, 1453);
    			if (!src_url_equal(img5.src, img5_src_value = "./assets/checkmark.png")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "Experience icon");
    			attr_dev(img5, "class", "icon");
    			add_location(img5, file$3, 64, 12, 1753);
    			add_location(h35, file$3, 70, 14, 1911);
    			add_location(p6, file$3, 71, 14, 1940);
    			add_location(div5, file$3, 69, 12, 1891);
    			add_location(article5, file$3, 63, 10, 1731);
    			attr_dev(div6, "class", "article-container");
    			add_location(div6, file$3, 7, 8, 296);
    			attr_dev(div7, "class", "details-container");
    			add_location(div7, file$3, 5, 6, 194);
    			attr_dev(h21, "class", "experience-sub-title");
    			add_location(h21, file$3, 77, 8, 2074);
    			if (!src_url_equal(img6.src, img6_src_value = "./assets/checkmark.png")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "Experience icon");
    			attr_dev(img6, "class", "icon");
    			add_location(img6, file$3, 80, 12, 2204);
    			add_location(h36, file$3, 86, 14, 2362);
    			add_location(p7, file$3, 87, 14, 2401);
    			add_location(div8, file$3, 85, 12, 2342);
    			add_location(article6, file$3, 79, 10, 2182);
    			if (!src_url_equal(img7.src, img7_src_value = "./assets/checkmark.png")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "Experience icon");
    			attr_dev(img7, "class", "icon");
    			add_location(img7, file$3, 91, 12, 2493);
    			add_location(h37, file$3, 97, 14, 2651);
    			add_location(p8, file$3, 98, 14, 2681);
    			add_location(div9, file$3, 96, 12, 2631);
    			add_location(article7, file$3, 90, 10, 2471);
    			if (!src_url_equal(img8.src, img8_src_value = "./assets/checkmark.png")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "Experience icon");
    			attr_dev(img8, "class", "icon");
    			add_location(img8, file$3, 102, 12, 2773);
    			add_location(h38, file$3, 108, 14, 2931);
    			add_location(p9, file$3, 109, 14, 2975);
    			add_location(div10, file$3, 107, 12, 2911);
    			add_location(article8, file$3, 101, 10, 2751);
    			if (!src_url_equal(img9.src, img9_src_value = "./assets/checkmark.png")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "Experience icon");
    			attr_dev(img9, "class", "icon");
    			add_location(img9, file$3, 113, 12, 3060);
    			add_location(h39, file$3, 119, 14, 3218);
    			add_location(p10, file$3, 120, 14, 3256);
    			add_location(div11, file$3, 118, 12, 3198);
    			add_location(article9, file$3, 112, 10, 3038);
    			attr_dev(div12, "class", "article-container");
    			add_location(div12, file$3, 78, 8, 2140);
    			attr_dev(div13, "class", "details-container");
    			add_location(div13, file$3, 76, 6, 2034);
    			attr_dev(div14, "class", "about-containers");
    			add_location(div14, file$3, 4, 4, 157);
    			attr_dev(div15, "class", "experience-details-container");
    			add_location(div15, file$3, 3, 2, 110);
    			if (!src_url_equal(img10.src, img10_src_value = "./assets/arrow.png")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "alt", "Arrow icon");
    			attr_dev(img10, "class", "icon arrow");
    			attr_dev(img10, "onclick", "location.href='./#projects'");
    			add_location(img10, file$3, 127, 2, 3366);
    			attr_dev(section, "id", "experience");
    			add_location(section, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, p0);
    			append_dev(section, t1);
    			append_dev(section, h1);
    			append_dev(section, t3);
    			append_dev(section, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div7);
    			append_dev(div7, h20);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, article0);
    			append_dev(article0, img0);
    			append_dev(article0, t6);
    			append_dev(article0, div0);
    			append_dev(div0, h30);
    			append_dev(div0, t8);
    			append_dev(div0, p1);
    			append_dev(div6, t10);
    			append_dev(div6, article1);
    			append_dev(article1, img1);
    			append_dev(article1, t11);
    			append_dev(article1, div1);
    			append_dev(div1, h31);
    			append_dev(div1, t13);
    			append_dev(div1, p2);
    			append_dev(div6, t15);
    			append_dev(div6, article2);
    			append_dev(article2, img2);
    			append_dev(article2, t16);
    			append_dev(article2, div2);
    			append_dev(div2, h32);
    			append_dev(div2, t18);
    			append_dev(div2, p3);
    			append_dev(div6, t20);
    			append_dev(div6, article3);
    			append_dev(article3, img3);
    			append_dev(article3, t21);
    			append_dev(article3, div3);
    			append_dev(div3, h33);
    			append_dev(div3, t23);
    			append_dev(div3, p4);
    			append_dev(div6, t25);
    			append_dev(div6, article4);
    			append_dev(article4, img4);
    			append_dev(article4, t26);
    			append_dev(article4, div4);
    			append_dev(div4, h34);
    			append_dev(div4, t28);
    			append_dev(div4, p5);
    			append_dev(div6, t30);
    			append_dev(div6, article5);
    			append_dev(article5, img5);
    			append_dev(article5, t31);
    			append_dev(article5, div5);
    			append_dev(div5, h35);
    			append_dev(div5, t33);
    			append_dev(div5, p6);
    			append_dev(div14, t35);
    			append_dev(div14, div13);
    			append_dev(div13, h21);
    			append_dev(div13, t37);
    			append_dev(div13, div12);
    			append_dev(div12, article6);
    			append_dev(article6, img6);
    			append_dev(article6, t38);
    			append_dev(article6, div8);
    			append_dev(div8, h36);
    			append_dev(div8, t40);
    			append_dev(div8, p7);
    			append_dev(div12, t42);
    			append_dev(div12, article7);
    			append_dev(article7, img7);
    			append_dev(article7, t43);
    			append_dev(article7, div9);
    			append_dev(div9, h37);
    			append_dev(div9, t45);
    			append_dev(div9, p8);
    			append_dev(div12, t47);
    			append_dev(div12, article8);
    			append_dev(article8, img8);
    			append_dev(article8, t48);
    			append_dev(article8, div10);
    			append_dev(div10, h38);
    			append_dev(div10, t50);
    			append_dev(div10, p9);
    			append_dev(div12, t52);
    			append_dev(div12, article9);
    			append_dev(article9, img9);
    			append_dev(article9, t53);
    			append_dev(article9, div11);
    			append_dev(div11, h39);
    			append_dev(div11, t55);
    			append_dev(div11, p10);
    			append_dev(section, t57);
    			append_dev(section, img10);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Experience', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Experience> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Experience extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Experience",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Projects.svelte generated by Svelte v3.59.2 */

    const file$2 = "src/components/Projects.svelte";

    function create_fragment$3(ctx) {
    	let section;
    	let p;
    	let t1;
    	let h1;
    	let t3;
    	let div10;
    	let div9;
    	let div2;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let h20;
    	let t6;
    	let div1;
    	let button0;
    	let t8;
    	let div5;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t9;
    	let h21;
    	let t11;
    	let div4;
    	let button1;
    	let t13;
    	let div8;
    	let div6;
    	let img2;
    	let img2_src_value;
    	let t14;
    	let h22;
    	let t16;
    	let div7;
    	let button2;
    	let t18;
    	let img3;
    	let img3_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			p = element("p");
    			p.textContent = "Browse My Recent";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Projects";
    			t3 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t4 = space();
    			h20 = element("h2");
    			h20.textContent = "Project One";
    			t6 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Github";
    			t8 = space();
    			div5 = element("div");
    			div3 = element("div");
    			img1 = element("img");
    			t9 = space();
    			h21 = element("h2");
    			h21.textContent = "Project Two";
    			t11 = space();
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "In Development";
    			t13 = space();
    			div8 = element("div");
    			div6 = element("div");
    			img2 = element("img");
    			t14 = space();
    			h22 = element("h2");
    			h22.textContent = "Project Three";
    			t16 = space();
    			div7 = element("div");
    			button2 = element("button");
    			button2.textContent = "In Development";
    			t18 = space();
    			img3 = element("img");
    			attr_dev(p, "class", "section__text__p1");
    			add_location(p, file$2, 1, 2, 26);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$2, 2, 2, 78);
    			if (!src_url_equal(img0.src, img0_src_value = "./assets/project-1.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Project 1");
    			attr_dev(img0, "class", "project-img");
    			add_location(img0, file$2, 7, 10, 294);
    			attr_dev(div0, "class", "article-container");
    			add_location(div0, file$2, 6, 8, 252);
    			attr_dev(h20, "class", "experience-sub-title project-title");
    			add_location(h20, file$2, 13, 8, 436);
    			attr_dev(button0, "class", "btn btn-color-2 project-btn");
    			attr_dev(button0, "onclick", "window.open('https://github.com/kvrarc/JetTipApp', '_blank')");
    			attr_dev(button0, "title", "Go to the GitHub repository");
    			add_location(button0, file$2, 15, 10, 546);
    			attr_dev(div1, "class", "btn-container");
    			add_location(div1, file$2, 14, 8, 508);
    			attr_dev(div2, "class", "details-container color-container");
    			add_location(div2, file$2, 5, 6, 196);
    			if (!src_url_equal(img1.src, img1_src_value = "./assets/project-2.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Project 2");
    			attr_dev(img1, "class", "project-img");
    			add_location(img1, file$2, 32, 10, 1103);
    			attr_dev(div3, "class", "article-container");
    			add_location(div3, file$2, 31, 8, 1061);
    			attr_dev(h21, "class", "experience-sub-title project-title");
    			add_location(h21, file$2, 38, 8, 1245);
    			attr_dev(button1, "class", "btn btn-color-2 project-btn");
    			attr_dev(button1, "onclick", "");
    			add_location(button1, file$2, 40, 10, 1355);
    			attr_dev(div4, "class", "btn-container");
    			add_location(div4, file$2, 39, 8, 1317);
    			attr_dev(div5, "class", "details-container color-container");
    			add_location(div5, file$2, 30, 6, 1005);
    			if (!src_url_equal(img2.src, img2_src_value = "./assets/project-3.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Project 3");
    			attr_dev(img2, "class", "project-img");
    			add_location(img2, file$2, 56, 10, 1812);
    			attr_dev(div6, "class", "article-container");
    			add_location(div6, file$2, 55, 8, 1770);
    			attr_dev(h22, "class", "experience-sub-title project-title");
    			add_location(h22, file$2, 62, 8, 1954);
    			attr_dev(button2, "class", "btn btn-color-2 project-btn");
    			attr_dev(button2, "onclick", "");
    			attr_dev(button2, "title", "Go to the GitHub repository");
    			add_location(button2, file$2, 64, 10, 2066);
    			attr_dev(div7, "class", "btn-container");
    			add_location(div7, file$2, 63, 8, 2028);
    			attr_dev(div8, "class", "details-container color-container");
    			add_location(div8, file$2, 54, 6, 1714);
    			attr_dev(div9, "class", "about-containers");
    			add_location(div9, file$2, 4, 4, 159);
    			attr_dev(div10, "class", "experience-details-container");
    			add_location(div10, file$2, 3, 2, 112);
    			if (!src_url_equal(img3.src, img3_src_value = "./assets/arrow.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Arrow icon");
    			attr_dev(img3, "class", "icon arrow");
    			attr_dev(img3, "onclick", "location.href='./#contact'");
    			add_location(img3, file$2, 81, 2, 2489);
    			attr_dev(section, "id", "projects");
    			add_location(section, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, p);
    			append_dev(section, t1);
    			append_dev(section, h1);
    			append_dev(section, t3);
    			append_dev(section, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img0);
    			append_dev(div2, t4);
    			append_dev(div2, h20);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(div9, t8);
    			append_dev(div9, div5);
    			append_dev(div5, div3);
    			append_dev(div3, img1);
    			append_dev(div5, t9);
    			append_dev(div5, h21);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, button1);
    			append_dev(div9, t13);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			append_dev(div6, img2);
    			append_dev(div8, t14);
    			append_dev(div8, h22);
    			append_dev(div8, t16);
    			append_dev(div8, div7);
    			append_dev(div7, button2);
    			append_dev(section, t18);
    			append_dev(section, img3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Projects', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Contact.svelte generated by Svelte v3.59.2 */

    const file$1 = "src/components/Contact.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let p0;
    	let t1;
    	let h1;
    	let t3;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t4;
    	let p1;
    	let a;

    	const block = {
    		c: function create() {
    			section = element("section");
    			p0 = element("p");
    			p0.textContent = "Get in Touch";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Contact Me";
    			t3 = space();
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t4 = space();
    			p1 = element("p");
    			a = element("a");
    			a.textContent = "baruahkaku549@gmail.com";
    			attr_dev(p0, "class", "section__text__p1");
    			add_location(p0, file$1, 1, 2, 25);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$1, 2, 2, 73);
    			if (!src_url_equal(img.src, img_src_value = "./assets/email.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Email icon");
    			attr_dev(img, "class", "icon contact-icon email-icon");
    			add_location(img, file$1, 5, 6, 199);
    			attr_dev(a, "href", "mailto:baruahkaku549@gmail.com");
    			add_location(a, file$1, 10, 9, 325);
    			add_location(p1, file$1, 10, 6, 322);
    			attr_dev(div0, "class", "contact-info-container");
    			add_location(div0, file$1, 4, 4, 156);
    			attr_dev(div1, "class", "contact-info-upper-container");
    			add_location(div1, file$1, 3, 2, 109);
    			attr_dev(section, "id", "contact");
    			add_location(section, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, p0);
    			append_dev(section, t1);
    			append_dev(section, h1);
    			append_dev(section, t3);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(p1, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Contact', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.59.2 */

    const file = "src/components/Footer.svelte";

    function create_fragment$1(ctx) {
    	let footer;
    	let nav;
    	let div;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;
    	let t3;
    	let li2;
    	let a2;
    	let t5;
    	let li3;
    	let a3;
    	let t7;
    	let p;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			nav = element("nav");
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "About";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Experience";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Projects";
    			t5 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Contact";
    			t7 = space();
    			p = element("p");
    			p.textContent = "Copyright © 2024 All Rights Reserved.";
    			attr_dev(a0, "href", "#about");
    			add_location(a0, file, 4, 12, 96);
    			add_location(li0, file, 4, 8, 92);
    			attr_dev(a1, "href", "#experience");
    			add_location(a1, file, 5, 12, 140);
    			add_location(li1, file, 5, 8, 136);
    			attr_dev(a2, "href", "#projects");
    			add_location(a2, file, 6, 12, 194);
    			add_location(li2, file, 6, 8, 190);
    			attr_dev(a3, "href", "#contact");
    			add_location(a3, file, 7, 12, 244);
    			add_location(li3, file, 7, 8, 240);
    			attr_dev(ul, "class", "nav-links");
    			add_location(ul, file, 3, 6, 61);
    			attr_dev(div, "class", "nav-links-container");
    			add_location(div, file, 2, 4, 21);
    			add_location(nav, file, 1, 2, 11);
    			add_location(p, file, 11, 2, 314);
    			add_location(footer, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, nav);
    			append_dev(nav, div);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(footer, t7);
    			append_dev(footer, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    function create_fragment(ctx) {
    	let nav;
    	let t0;
    	let profile;
    	let t1;
    	let about;
    	let t2;
    	let experience;
    	let t3;
    	let projects;
    	let t4;
    	let contact;
    	let t5;
    	let footer;
    	let current;
    	nav = new Nav({ $$inline: true });
    	profile = new Profile({ $$inline: true });
    	about = new About({ $$inline: true });
    	experience = new Experience({ $$inline: true });
    	projects = new Projects({ $$inline: true });
    	contact = new Contact({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(nav.$$.fragment);
    			t0 = space();
    			create_component(profile.$$.fragment);
    			t1 = space();
    			create_component(about.$$.fragment);
    			t2 = space();
    			create_component(experience.$$.fragment);
    			t3 = space();
    			create_component(projects.$$.fragment);
    			t4 = space();
    			create_component(contact.$$.fragment);
    			t5 = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(nav, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(profile, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(about, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(experience, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(projects, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(contact, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(profile.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(experience.$$.fragment, local);
    			transition_in(projects.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(profile.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(experience.$$.fragment, local);
    			transition_out(projects.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(nav, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(profile, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(about, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(experience, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(projects, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(contact, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Nav,
    		Profile,
    		About,
    		Experience,
    		Projects,
    		Contact,
    		Footer
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
