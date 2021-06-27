
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /**
     * Clamp `num` to the range `[min, max]`
     * @param {number} num
     * @param {number} min
     * @param {number} max
     */
    function clamp(num, min, max) {
    	return num < min ? min : num > max ? max : num;
    }

    /* src\DoubleRangeSlider.svelte generated by Svelte v3.38.2 */
    const file$1 = "src\\DoubleRangeSlider.svelte";

    function create_fragment$1(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "body svelte-4cpbl2");
    			set_style(div0, "left", 100 * /*start*/ ctx[0] + "%");
    			set_style(div0, "right", 100 * (1 - /*end*/ ctx[1]) + "%");
    			add_location(div0, file$1, 86, 2, 2603);
    			attr_dev(div1, "class", "handle svelte-4cpbl2");
    			attr_dev(div1, "data-which", "start");
    			set_style(div1, "left", 100 * /*start*/ ctx[0] + "%\n\t\t\t");
    			add_location(div1, file$1, 96, 2, 2816);
    			attr_dev(div2, "class", "handle svelte-4cpbl2");
    			attr_dev(div2, "data-which", "end");
    			set_style(div2, "left", 100 * /*end*/ ctx[1] + "%\n\t\t\t");
    			add_location(div2, file$1, 106, 2, 3034);
    			attr_dev(div3, "class", "slider svelte-4cpbl2");
    			add_location(div3, file$1, 85, 1, 2561);
    			attr_dev(div4, "class", "double-range-container svelte-4cpbl2");
    			add_location(div4, file$1, 84, 0, 2523);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			/*div0_binding*/ ctx[7](div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			/*div1_binding*/ ctx[8](div1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			/*div3_binding*/ ctx[9](div3);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(draggable.call(null, div0)),
    					listen_dev(div0, "dragmove", stop_propagation(prevent_default(/*setHandlesFromBody*/ ctx[6])), false, true, true),
    					action_destroyer(draggable.call(null, div1)),
    					listen_dev(div1, "dragmove", stop_propagation(prevent_default(/*setHandlePosition*/ ctx[5]("start"))), false, true, true),
    					action_destroyer(draggable.call(null, div2)),
    					listen_dev(div2, "dragmove", stop_propagation(prevent_default(/*setHandlePosition*/ ctx[5]("end"))), false, true, true)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*start*/ 1) {
    				set_style(div0, "left", 100 * /*start*/ ctx[0] + "%");
    			}

    			if (dirty & /*end*/ 2) {
    				set_style(div0, "right", 100 * (1 - /*end*/ ctx[1]) + "%");
    			}

    			if (dirty & /*start*/ 1) {
    				set_style(div1, "left", 100 * /*start*/ ctx[0] + "%\n\t\t\t");
    			}

    			if (dirty & /*end*/ 2) {
    				set_style(div2, "left", 100 * /*end*/ ctx[1] + "%\n\t\t\t");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			/*div0_binding*/ ctx[7](null);
    			/*div1_binding*/ ctx[8](null);
    			/*div3_binding*/ ctx[9](null);
    			mounted = false;
    			run_all(dispose);
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

    function draggable(node) {
    	let x;
    	let y;

    	function handleMousedown(event) {
    		if (event.type === "touchstart") {
    			event = event.touches[0];
    		}

    		x = event.clientX;
    		y = event.clientY;
    		node.dispatchEvent(new CustomEvent("dragstart", { detail: { x, y } }));
    		window.addEventListener("mousemove", handleMousemove);
    		window.addEventListener("mouseup", handleMouseup);
    		window.addEventListener("touchmove", handleMousemove);
    		window.addEventListener("touchend", handleMouseup);
    	}

    	function handleMousemove(event) {
    		if (event.type === "touchmove") {
    			event = event.changedTouches[0];
    		}

    		const dx = event.clientX - x;
    		const dy = event.clientY - y;
    		x = event.clientX;
    		y = event.clientY;
    		node.dispatchEvent(new CustomEvent("dragmove", { detail: { x, y, dx, dy } }));
    	}

    	function handleMouseup(event) {
    		x = event.clientX;
    		y = event.clientY;
    		node.dispatchEvent(new CustomEvent("dragend", { detail: { x, y } }));
    		window.removeEventListener("mousemove", handleMousemove);
    		window.removeEventListener("mouseup", handleMouseup);
    		window.removeEventListener("touchmove", handleMousemove);
    		window.removeEventListener("touchend", handleMouseup);
    	}

    	node.addEventListener("mousedown", handleMousedown);
    	node.addEventListener("touchstart", handleMousedown);

    	return {
    		destroy() {
    			node.removeEventListener("mousedown", handleMousedown);
    			node.removeEventListener("touchstart", handleMousedown);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DoubleRangeSlider", slots, []);
    	let { start = 0 } = $$props;
    	let { end = 1 } = $$props;
    	let leftHandle;
    	let body;
    	let slider;

    	function setHandlePosition(which) {
    		return function (evt) {
    			const { left, right } = slider.getBoundingClientRect();
    			const parentWidth = right - left;
    			const p = Math.min(Math.max((evt.detail.x - left) / parentWidth, 0), 1);

    			if (which === "start") {
    				$$invalidate(0, start = p);
    				$$invalidate(1, end = Math.max(end, p));
    			} else {
    				$$invalidate(0, start = Math.min(p, start));
    				$$invalidate(1, end = p);
    			}
    		};
    	}

    	function setHandlesFromBody(evt) {
    		const { width } = body.getBoundingClientRect();
    		const { left, right } = slider.getBoundingClientRect();
    		const parentWidth = right - left;
    		const leftHandleLeft = leftHandle.getBoundingClientRect().left;
    		const pxStart = clamp(leftHandleLeft + event.detail.dx - left, 0, parentWidth - width);
    		const pxEnd = clamp(pxStart + width, width, parentWidth);
    		const pStart = pxStart / parentWidth;
    		const pEnd = pxEnd / parentWidth;
    		$$invalidate(0, start = pStart);
    		$$invalidate(1, end = pEnd);
    	}

    	const writable_props = ["start", "end"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DoubleRangeSlider> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			body = $$value;
    			$$invalidate(3, body);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			leftHandle = $$value;
    			$$invalidate(2, leftHandle);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			slider = $$value;
    			$$invalidate(4, slider);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("start" in $$props) $$invalidate(0, start = $$props.start);
    		if ("end" in $$props) $$invalidate(1, end = $$props.end);
    	};

    	$$self.$capture_state = () => ({
    		clamp,
    		start,
    		end,
    		leftHandle,
    		body,
    		slider,
    		draggable,
    		setHandlePosition,
    		setHandlesFromBody
    	});

    	$$self.$inject_state = $$props => {
    		if ("start" in $$props) $$invalidate(0, start = $$props.start);
    		if ("end" in $$props) $$invalidate(1, end = $$props.end);
    		if ("leftHandle" in $$props) $$invalidate(2, leftHandle = $$props.leftHandle);
    		if ("body" in $$props) $$invalidate(3, body = $$props.body);
    		if ("slider" in $$props) $$invalidate(4, slider = $$props.slider);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		start,
    		end,
    		leftHandle,
    		body,
    		slider,
    		setHandlePosition,
    		setHandlesFromBody,
    		div0_binding,
    		div1_binding,
    		div3_binding
    	];
    }

    class DoubleRangeSlider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { start: 0, end: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DoubleRangeSlider",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get start() {
    		throw new Error("<DoubleRangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<DoubleRangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<DoubleRangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<DoubleRangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src\App.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    // (162:2) {#each $jobCriteria.required_stack as tag}
    function create_each_block_4(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[29] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-primary mx-1");
    			add_location(span, file, 162, 2, 4941);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					span,
    					"click",
    					function () {
    						if (is_function(/*removeCriterionRequired*/ ctx[10](/*tag*/ ctx[29], /*$jobCriteria*/ ctx[8].required_stack))) /*removeCriterionRequired*/ ctx[10](/*tag*/ ctx[29], /*$jobCriteria*/ ctx[8].required_stack).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$jobCriteria*/ 256 && t_value !== (t_value = /*tag*/ ctx[29] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(162:2) {#each $jobCriteria.required_stack as tag}",
    		ctx
    	});

    	return block;
    }

    // (182:2) {#each $jobCriteria.optional_stack as tag}
    function create_each_block_3(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[29] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-primary mx-1");
    			add_location(span, file, 182, 2, 5737);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					span,
    					"click",
    					function () {
    						if (is_function(/*removeCriterionOptional*/ ctx[11](/*tag*/ ctx[29]))) /*removeCriterionOptional*/ ctx[11](/*tag*/ ctx[29]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$jobCriteria*/ 256 && t_value !== (t_value = /*tag*/ ctx[29] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(182:2) {#each $jobCriteria.optional_stack as tag}",
    		ctx
    	});

    	return block;
    }

    // (202:2) {#each $jobCriteria.location as tag}
    function create_each_block_2(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[29] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge bg-primary mx-1");
    			add_location(span, file, 202, 2, 6436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					span,
    					"click",
    					function () {
    						if (is_function(/*removeCriterionLocation*/ ctx[12](/*tag*/ ctx[29]))) /*removeCriterionLocation*/ ctx[12](/*tag*/ ctx[29]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$jobCriteria*/ 256 && t_value !== (t_value = /*tag*/ ctx[29] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(202:2) {#each $jobCriteria.location as tag}",
    		ctx
    	});

    	return block;
    }

    // (269:23) 
    function create_if_block_1(ctx) {
    	let h4;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "No jobs have been found :(";
    			attr_dev(h4, "class", "text-center");
    			add_location(h4, file, 269, 2, 8615);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(269:23) ",
    		ctx
    	});

    	return block;
    }

    // (237:1) {#if jobs.length > 0}
    function create_if_block(ctx) {
    	let h4;
    	let t1;
    	let div;
    	let each_value = /*jobs*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Jobs found:";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file, 237, 1, 7489);
    			add_location(div, file, 238, 1, 7511);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*jobs*/ 64) {
    				each_value = /*jobs*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(237:1) {#if jobs.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (259:6) {#each job["stack_in_requirements"] as stack}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*stack*/ ctx[26] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "badge rounded-pill bg-secondary mx-1");
    			add_location(span, file, 259, 6, 8442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*jobs*/ 64 && t_value !== (t_value = /*stack*/ ctx[26] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(259:6) {#each job[\\\"stack_in_requirements\\\"] as stack}",
    		ctx
    	});

    	return block;
    }

    // (240:2) {#each jobs as job}
    function create_each_block(ctx) {
    	let a;
    	let div11;
    	let div3;
    	let div0;
    	let h5;
    	let t0_value = /*job*/ ctx[23]["title"] + "";
    	let t0;
    	let t1;
    	let div2;
    	let div1;
    	let t2_value = formatNumber(/*job*/ ctx[23]["min_salary"]) + "";
    	let t2;
    	let t3;
    	let t4_value = formatNumber(/*job*/ ctx[23]["max_salary"]) + "";
    	let t4;
    	let t5;
    	let t6;
    	let div10;
    	let div7;
    	let div4;
    	let i0;
    	let t7_value = /*job*/ ctx[23]["location"] + "";
    	let t7;
    	let t8;
    	let div5;
    	let i1;
    	let t9_value = /*job*/ ctx[23]["company_name"] + "";
    	let t9;
    	let t10;
    	let div6;
    	let i2;
    	let t11_value = /*job*/ ctx[23]["seniority"] + "";
    	let t11;
    	let t12;
    	let div9;
    	let div8;
    	let t13;
    	let a_href_value;
    	let each_value_1 = /*job*/ ctx[23]["stack_in_requirements"];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			div11 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = text(" - ");
    			t4 = text(t4_value);
    			t5 = text(" PLN");
    			t6 = space();
    			div10 = element("div");
    			div7 = element("div");
    			div4 = element("div");
    			i0 = element("i");
    			t7 = text(t7_value);
    			t8 = space();
    			div5 = element("div");
    			i1 = element("i");
    			t9 = text(t9_value);
    			t10 = space();
    			div6 = element("div");
    			i2 = element("i");
    			t11 = text(t11_value);
    			t12 = space();
    			div9 = element("div");
    			div8 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			attr_dev(h5, "class", "mb-0");
    			add_location(h5, file, 244, 5, 7700);
    			attr_dev(div0, "class", "col-6 align-items-center p-0");
    			add_location(div0, file, 243, 4, 7652);
    			attr_dev(div1, "class", "salary");
    			add_location(div1, file, 247, 5, 7832);
    			attr_dev(div2, "class", "col-6 d-flex justify-content-end align-items-center p-0 pe-4");
    			add_location(div2, file, 246, 4, 7752);
    			attr_dev(div3, "class", "row pt-2");
    			add_location(div3, file, 242, 3, 7625);
    			attr_dev(i0, "class", "bi bi-geo-alt pe-1");
    			add_location(i0, file, 252, 32, 8049);
    			attr_dev(div4, "class", "d-inline pe-2");
    			add_location(div4, file, 252, 5, 8022);
    			attr_dev(i1, "class", "bi bi-building pe-1");
    			add_location(i1, file, 253, 32, 8139);
    			attr_dev(div5, "class", "d-inline pe-2");
    			add_location(div5, file, 253, 5, 8112);
    			attr_dev(i2, "class", "bi bi-person-circle pe-1");
    			add_location(i2, file, 254, 27, 8229);
    			attr_dev(div6, "class", "d-inline");
    			add_location(div6, file, 254, 5, 8207);
    			attr_dev(div7, "class", "col-6 p-0");
    			add_location(div7, file, 251, 4, 7993);
    			attr_dev(div8, "class", "d-flex justify-content-end pe-4");
    			add_location(div8, file, 257, 5, 8338);
    			attr_dev(div9, "class", "col-6 p-0");
    			add_location(div9, file, 256, 4, 8309);
    			attr_dev(div10, "class", "row pt-1 job-tags");
    			add_location(div10, file, 250, 3, 7957);
    			attr_dev(div11, "class", "job-offer py-2 ps-4 mb-2");
    			add_location(div11, file, 241, 2, 7583);
    			attr_dev(a, "href", a_href_value = /*job*/ ctx[23]["url"]);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 240, 2, 7541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div11);
    			append_dev(div11, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h5);
    			append_dev(h5, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, t5);
    			append_dev(div11, t6);
    			append_dev(div11, div10);
    			append_dev(div10, div7);
    			append_dev(div7, div4);
    			append_dev(div4, i0);
    			append_dev(div4, t7);
    			append_dev(div7, t8);
    			append_dev(div7, div5);
    			append_dev(div5, i1);
    			append_dev(div5, t9);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			append_dev(div6, i2);
    			append_dev(div6, t11);
    			append_dev(div10, t12);
    			append_dev(div10, div9);
    			append_dev(div9, div8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div8, null);
    			}

    			append_dev(a, t13);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*jobs*/ 64 && t0_value !== (t0_value = /*job*/ ctx[23]["title"] + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*jobs*/ 64 && t2_value !== (t2_value = formatNumber(/*job*/ ctx[23]["min_salary"]) + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*jobs*/ 64 && t4_value !== (t4_value = formatNumber(/*job*/ ctx[23]["max_salary"]) + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*jobs*/ 64 && t7_value !== (t7_value = /*job*/ ctx[23]["location"] + "")) set_data_dev(t7, t7_value);
    			if (dirty[0] & /*jobs*/ 64 && t9_value !== (t9_value = /*job*/ ctx[23]["company_name"] + "")) set_data_dev(t9, t9_value);
    			if (dirty[0] & /*jobs*/ 64 && t11_value !== (t11_value = /*job*/ ctx[23]["seniority"] + "")) set_data_dev(t11, t11_value);

    			if (dirty[0] & /*jobs*/ 64) {
    				each_value_1 = /*job*/ ctx[23]["stack_in_requirements"];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div8, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty[0] & /*jobs*/ 64 && a_href_value !== (a_href_value = /*job*/ ctx[23]["url"])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(240:2) {#each jobs as job}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div14;
    	let img;
    	let img_src_value;
    	let t0;
    	let h4;
    	let t2;
    	let label0;
    	let t4;
    	let div1;
    	let input0;
    	let t5;
    	let div0;
    	let button0;
    	let t7;
    	let div2;
    	let t8;
    	let label1;
    	let t10;
    	let div4;
    	let input1;
    	let t11;
    	let div3;
    	let button1;
    	let t13;
    	let div5;
    	let t14;
    	let label2;
    	let t16;
    	let div7;
    	let input2;
    	let t17;
    	let div6;
    	let button2;
    	let t19;
    	let div8;
    	let t20;
    	let div12;
    	let div9;
    	let label3;
    	let t22;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let t29;
    	let div11;
    	let label4;
    	let t31;
    	let doublerangeslider;
    	let updating_start;
    	let updating_end;
    	let t32;
    	let div10;
    	let t33_value = nice(/*start*/ ctx[1], true) + "";
    	let t33;
    	let t34;
    	let t35_value = nice(/*end*/ ctx[2], true) + "";
    	let t35;
    	let t36;
    	let t37;
    	let div13;
    	let button3;
    	let t39;
    	let t40;
    	let br0;
    	let br1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*$jobCriteria*/ ctx[8].required_stack;
    	validate_each_argument(each_value_4);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let each_value_3 = /*$jobCriteria*/ ctx[8].optional_stack;
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*$jobCriteria*/ ctx[8].location;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	function doublerangeslider_start_binding(value) {
    		/*doublerangeslider_start_binding*/ ctx[19](value);
    	}

    	function doublerangeslider_end_binding(value) {
    		/*doublerangeslider_end_binding*/ ctx[20](value);
    	}

    	let doublerangeslider_props = {};

    	if (/*start*/ ctx[1] !== void 0) {
    		doublerangeslider_props.start = /*start*/ ctx[1];
    	}

    	if (/*end*/ ctx[2] !== void 0) {
    		doublerangeslider_props.end = /*end*/ ctx[2];
    	}

    	doublerangeslider = new DoubleRangeSlider({
    			props: doublerangeslider_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(doublerangeslider, "start", doublerangeslider_start_binding));
    	binding_callbacks.push(() => bind(doublerangeslider, "end", doublerangeslider_end_binding));

    	function select_block_type(ctx, dirty) {
    		if (/*jobs*/ ctx[6].length > 0) return create_if_block;
    		if (/*jobsFetched*/ ctx[7]) return create_if_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			img = element("img");
    			t0 = space();
    			h4 = element("h4");
    			h4.textContent = "Search for your perfect job:";
    			t2 = space();
    			label0 = element("label");
    			label0.textContent = "Required stack:";
    			t4 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t5 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t7 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t8 = space();
    			label1 = element("label");
    			label1.textContent = "Optional stack:";
    			t10 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t11 = space();
    			div3 = element("div");
    			button1 = element("button");
    			button1.textContent = "+";
    			t13 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t14 = space();
    			label2 = element("label");
    			label2.textContent = "Location:";
    			t16 = space();
    			div7 = element("div");
    			input2 = element("input");
    			t17 = space();
    			div6 = element("div");
    			button2 = element("button");
    			button2.textContent = "+";
    			t19 = space();
    			div8 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t20 = space();
    			div12 = element("div");
    			div9 = element("div");
    			label3 = element("label");
    			label3.textContent = "Experience level:";
    			t22 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "All";
    			option1 = element("option");
    			option1.textContent = "Trainee";
    			option2 = element("option");
    			option2.textContent = "Junior";
    			option3 = element("option");
    			option3.textContent = "Mid";
    			option4 = element("option");
    			option4.textContent = "Senior";
    			option5 = element("option");
    			option5.textContent = "Expert";
    			t29 = space();
    			div11 = element("div");
    			label4 = element("label");
    			label4.textContent = "Salary:";
    			t31 = space();
    			create_component(doublerangeslider.$$.fragment);
    			t32 = space();
    			div10 = element("div");
    			t33 = text(t33_value);
    			t34 = text(" PLN - ");
    			t35 = text(t35_value);
    			t36 = text(" PLN");
    			t37 = space();
    			div13 = element("div");
    			button3 = element("button");
    			button3.textContent = "Find Matching Job Offers";
    			t39 = space();
    			if (if_block) if_block.c();
    			t40 = space();
    			br0 = element("br");
    			br1 = element("br");
    			attr_dev(img, "class", "mx-auto d-block responsive");
    			if (img.src !== (img_src_value = "logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "bs-free logo");
    			add_location(img, file, 144, 1, 4170);
    			add_location(h4, file, 145, 1, 4246);
    			attr_dev(label0, "for", "inputMustHave");
    			attr_dev(label0, "class", "form-label mb-0 mt-1");
    			add_location(label0, file, 146, 1, 4285);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "inputMustHave");
    			attr_dev(input0, "placeholder", "Stack that MUST be in a job offer (click ENTER to add)");
    			add_location(input0, file, 148, 2, 4394);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "btn btn-outline-primary btn-sm");
    			add_location(button0, file, 157, 3, 4708);
    			attr_dev(div0, "class", "d-inline-flex p-2");
    			add_location(div0, file, 156, 2, 4673);
    			attr_dev(div1, "class", "d-flex mb-0");
    			add_location(div1, file, 147, 1, 4366);
    			add_location(div2, file, 160, 1, 4888);
    			attr_dev(label1, "for", "inputNiceHave");
    			attr_dev(label1, "class", "form-label mb-0 mt-1");
    			add_location(label1, file, 166, 1, 5082);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "inputNiceHave");
    			attr_dev(input1, "placeholder", "Stack that CAN be in a job offer (click ENTER to add)");
    			add_location(input1, file, 168, 2, 5191);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "btn btn-outline-primary btn-sm");
    			add_location(button1, file, 177, 3, 5504);
    			attr_dev(div3, "class", "d-inline-flex p-2");
    			add_location(div3, file, 176, 2, 5469);
    			attr_dev(div4, "class", "d-flex mb-0");
    			add_location(div4, file, 167, 1, 5163);
    			add_location(div5, file, 180, 1, 5684);
    			attr_dev(label2, "for", "location");
    			attr_dev(label2, "class", "form-label form-label mb-0 mt-1");
    			add_location(label2, file, 186, 1, 5848);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "location");
    			attr_dev(input2, "placeholder", "City or 'remote' (click ENTER to add)");
    			add_location(input2, file, 188, 2, 5957);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "btn btn-outline-primary btn-sm");
    			add_location(button2, file, 197, 3, 6226);
    			attr_dev(div6, "class", "d-inline-flex p-2");
    			add_location(div6, file, 196, 2, 6191);
    			attr_dev(div7, "class", "d-flex mb-0");
    			add_location(div7, file, 187, 1, 5929);
    			add_location(div8, file, 200, 1, 6389);
    			attr_dev(label3, "for", "seniority");
    			attr_dev(label3, "class", "form-label form-label mb-0 mt-1");
    			add_location(label3, file, 208, 3, 6590);
    			option0.selected = true;
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file, 215, 4, 6822);
    			option1.__value = "Trainee";
    			option1.value = option1.__value;
    			add_location(option1, file, 216, 4, 6865);
    			option2.__value = "Junior";
    			option2.value = option2.__value;
    			add_location(option2, file, 217, 4, 6910);
    			option3.__value = "Mid";
    			option3.value = option3.__value;
    			add_location(option3, file, 218, 4, 6953);
    			option4.__value = "Senior";
    			option4.value = option4.__value;
    			add_location(option4, file, 219, 4, 6990);
    			option5.__value = "Expert";
    			option5.value = option5.__value;
    			add_location(option5, file, 220, 4, 7033);
    			attr_dev(select, "id", "seniority");
    			attr_dev(select, "class", "form-select mb-0");
    			attr_dev(select, "aria-label", "seniority select");
    			if (/*$jobCriteria*/ ctx[8].experience === void 0) add_render_callback(() => /*select_change_handler*/ ctx[18].call(select));
    			add_location(select, file, 209, 3, 6682);
    			attr_dev(div9, "class", "col-6");
    			add_location(div9, file, 207, 2, 6567);
    			attr_dev(label4, "for", "salary");
    			attr_dev(label4, "class", "form-label form-label mb-0 mt-1");
    			add_location(label4, file, 224, 3, 7135);
    			add_location(div10, file, 226, 3, 7259);
    			attr_dev(div11, "class", "col-6 align-items-end");
    			add_location(div11, file, 223, 2, 7096);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file, 206, 1, 6547);
    			attr_dev(button3, "class", "btn btn-primary");
    			add_location(button3, file, 233, 2, 7369);
    			attr_dev(div13, "class", "d-grid");
    			add_location(div13, file, 232, 1, 7346);
    			attr_dev(div14, "class", "container");
    			add_location(div14, file, 143, 0, 4145);
    			add_location(br0, file, 271, 6, 8684);
    			add_location(br1, file, 271, 10, 8688);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, img);
    			append_dev(div14, t0);
    			append_dev(div14, h4);
    			append_dev(div14, t2);
    			append_dev(div14, label0);
    			append_dev(div14, t4);
    			append_dev(div14, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*required_stack*/ ctx[3]);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div14, t7);
    			append_dev(div14, div2);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div2, null);
    			}

    			append_dev(div14, t8);
    			append_dev(div14, label1);
    			append_dev(div14, t10);
    			append_dev(div14, div4);
    			append_dev(div4, input1);
    			set_input_value(input1, /*optional_stack*/ ctx[4]);
    			append_dev(div4, t11);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			append_dev(div14, t13);
    			append_dev(div14, div5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div5, null);
    			}

    			append_dev(div14, t14);
    			append_dev(div14, label2);
    			append_dev(div14, t16);
    			append_dev(div14, div7);
    			append_dev(div7, input2);
    			set_input_value(input2, /*location*/ ctx[5]);
    			append_dev(div7, t17);
    			append_dev(div7, div6);
    			append_dev(div6, button2);
    			append_dev(div14, t19);
    			append_dev(div14, div8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div8, null);
    			}

    			append_dev(div14, t20);
    			append_dev(div14, div12);
    			append_dev(div12, div9);
    			append_dev(div9, label3);
    			append_dev(div9, t22);
    			append_dev(div9, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			select_option(select, /*$jobCriteria*/ ctx[8].experience);
    			append_dev(div12, t29);
    			append_dev(div12, div11);
    			append_dev(div11, label4);
    			append_dev(div11, t31);
    			mount_component(doublerangeslider, div11, null);
    			append_dev(div11, t32);
    			append_dev(div11, div10);
    			append_dev(div10, t33);
    			append_dev(div10, t34);
    			append_dev(div10, t35);
    			append_dev(div10, t36);
    			append_dev(div14, t37);
    			append_dev(div14, div13);
    			append_dev(div13, button3);
    			append_dev(div14, t39);
    			if (if_block) if_block.m(div14, null);
    			append_dev(div14, t40);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[15]),
    					listen_dev(
    						input0,
    						"keypress",
    						function () {
    							if (is_function(/*handleKeyPress*/ ctx[13](event, /*required_stack*/ ctx[3], /*$jobCriteria*/ ctx[8].required_stack, "inputMustHave"))) /*handleKeyPress*/ ctx[13](event, /*required_stack*/ ctx[3], /*$jobCriteria*/ ctx[8].required_stack, "inputMustHave").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*addRequiredStack*/ ctx[9](/*required_stack*/ ctx[3], /*$jobCriteria*/ ctx[8].required_stack, "inputMustHave"))) /*addRequiredStack*/ ctx[9](/*required_stack*/ ctx[3], /*$jobCriteria*/ ctx[8].required_stack, "inputMustHave").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[16]),
    					listen_dev(
    						input1,
    						"keypress",
    						function () {
    							if (is_function(/*handleKeyPress*/ ctx[13](event, /*optional_stack*/ ctx[4], /*$jobCriteria*/ ctx[8].optional_stack, "inputNiceHave"))) /*handleKeyPress*/ ctx[13](event, /*optional_stack*/ ctx[4], /*$jobCriteria*/ ctx[8].optional_stack, "inputNiceHave").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*addRequiredStack*/ ctx[9](/*optional_stack*/ ctx[4], /*$jobCriteria*/ ctx[8].optional_stack, "inputNiceHave"))) /*addRequiredStack*/ ctx[9](/*optional_stack*/ ctx[4], /*$jobCriteria*/ ctx[8].optional_stack, "inputNiceHave").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[17]),
    					listen_dev(
    						input2,
    						"keypress",
    						function () {
    							if (is_function(/*handleKeyPress*/ ctx[13](event, /*location*/ ctx[5], /*$jobCriteria*/ ctx[8].location, "location"))) /*handleKeyPress*/ ctx[13](event, /*location*/ ctx[5], /*$jobCriteria*/ ctx[8].location, "location").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button2,
    						"click",
    						function () {
    							if (is_function(/*addRequiredStack*/ ctx[9](/*location*/ ctx[5], /*$jobCriteria*/ ctx[8].location, "location"))) /*addRequiredStack*/ ctx[9](/*location*/ ctx[5], /*$jobCriteria*/ ctx[8].location, "location").apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[18]),
    					listen_dev(button3, "click", /*fetchJobs*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*required_stack*/ 8 && input0.value !== /*required_stack*/ ctx[3]) {
    				set_input_value(input0, /*required_stack*/ ctx[3]);
    			}

    			if (dirty[0] & /*removeCriterionRequired, $jobCriteria*/ 1280) {
    				each_value_4 = /*$jobCriteria*/ ctx[8].required_stack;
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_4(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_4.length;
    			}

    			if (dirty[0] & /*optional_stack*/ 16 && input1.value !== /*optional_stack*/ ctx[4]) {
    				set_input_value(input1, /*optional_stack*/ ctx[4]);
    			}

    			if (dirty[0] & /*removeCriterionOptional, $jobCriteria*/ 2304) {
    				each_value_3 = /*$jobCriteria*/ ctx[8].optional_stack;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty[0] & /*location*/ 32 && input2.value !== /*location*/ ctx[5]) {
    				set_input_value(input2, /*location*/ ctx[5]);
    			}

    			if (dirty[0] & /*removeCriterionLocation, $jobCriteria*/ 4352) {
    				each_value_2 = /*$jobCriteria*/ ctx[8].location;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div8, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (dirty[0] & /*$jobCriteria*/ 256) {
    				select_option(select, /*$jobCriteria*/ ctx[8].experience);
    			}

    			const doublerangeslider_changes = {};

    			if (!updating_start && dirty[0] & /*start*/ 2) {
    				updating_start = true;
    				doublerangeslider_changes.start = /*start*/ ctx[1];
    				add_flush_callback(() => updating_start = false);
    			}

    			if (!updating_end && dirty[0] & /*end*/ 4) {
    				updating_end = true;
    				doublerangeslider_changes.end = /*end*/ ctx[2];
    				add_flush_callback(() => updating_end = false);
    			}

    			doublerangeslider.$set(doublerangeslider_changes);
    			if ((!current || dirty[0] & /*start*/ 2) && t33_value !== (t33_value = nice(/*start*/ ctx[1], true) + "")) set_data_dev(t33, t33_value);
    			if ((!current || dirty[0] & /*end*/ 4) && t35_value !== (t35_value = nice(/*end*/ ctx[2], true) + "")) set_data_dev(t35, t35_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div14, t40);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(doublerangeslider.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(doublerangeslider.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			destroy_component(doublerangeslider);

    			if (if_block) {
    				if_block.d();
    			}

    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			mounted = false;
    			run_all(dispose);
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

    function formatNumber(num) {
    	return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
    }

    function nice(num, sep) {
    	if (!num && num !== 0) return "";
    	num = Math.round(num.toFixed(2) * 40000);

    	if (sep) {
    		num = formatNumber(num);
    	}

    	return num;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $jobCriteria,
    		$$unsubscribe_jobCriteria = noop,
    		$$subscribe_jobCriteria = () => ($$unsubscribe_jobCriteria(), $$unsubscribe_jobCriteria = subscribe(jobCriteria, $$value => $$invalidate(8, $jobCriteria = $$value)), jobCriteria);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_jobCriteria());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let start = 0;
    	let end = 1;
    	
    	

    	const jobCriteria = writable({
    		required_stack: [],
    		optional_stack: [],
    		min_salary: null,
    		max_salary: null,
    		location: [],
    		experience: ""
    	});

    	validate_store(jobCriteria, "jobCriteria");
    	$$subscribe_jobCriteria();
    	let required_stack;
    	let optional_stack;
    	let location;

    	// function addRequiredStack() {
    	// 	if (required_stack != null && required_stack !== "" && !$jobCriteria.required_stack.includes(required_stack)) {
    	// 		let stack = $jobCriteria.required_stack
    	// 		stack.push(required_stack);
    	// 		$jobCriteria.required_stack = stack;
    	// 		document.getElementById('inputMustHave').value = "";
    	// 		required_stack = '';
    	// 	}
    	// }
    	function addRequiredStack(stackType, storeObject, inputID) {
    		if (stackType != null && stackType !== "" && !storeObject.includes(stackType)) {
    			let stack = storeObject;
    			stack.push(stackType);
    			storeObject = stack;
    			jobCriteria.set($jobCriteria);
    			document.getElementById(inputID).value = "";
    			stackType = "";
    		}
    	}

    	

    	function addOptionalStack() {
    		if (optional_stack != null && optional_stack !== "" && !$jobCriteria.optional_stack.includes(optional_stack)) {
    			let stack = $jobCriteria.optional_stack;
    			stack.push(optional_stack);
    			set_store_value(jobCriteria, $jobCriteria.optional_stack = stack, $jobCriteria);
    			document.getElementById("inputNiceHave").value = "";
    			$$invalidate(4, optional_stack = "");
    		}
    	}

    	

    	function addLocation() {
    		if (location != null && location !== "" && !$jobCriteria.location.includes(location)) {
    			let stack = $jobCriteria.location;
    			stack.push(location);
    			set_store_value(jobCriteria, $jobCriteria.location = stack, $jobCriteria);
    			document.getElementById("location").value = "";
    			$$invalidate(5, location = "");
    		}
    	}

    	

    	function removeCriterionRequired(crit, storeObject) {
    		let arr = storeObject;
    		const index = arr.indexOf(crit);
    		arr.splice(index, 1);
    		storeObject = arr;
    		jobCriteria.set($jobCriteria);
    	}

    	

    	// function removeCriterionRequired(crit) {
    	// 	let arr = $jobCriteria.required_stack;
    	// 	const index = arr.indexOf(crit);
    	// 	arr.splice(index, 1);
    	// 	$jobCriteria.required_stack = arr;
    	// }
    	function removeCriterionOptional(crit) {
    		let arr = $jobCriteria.optional_stack;
    		const index = arr.indexOf(crit);
    		arr.splice(index, 1);
    		set_store_value(jobCriteria, $jobCriteria.optional_stack = arr, $jobCriteria);
    	}

    	

    	function removeCriterionLocation(crit) {
    		let arr = $jobCriteria.location;
    		const index = arr.indexOf(crit);
    		arr.splice(index, 1);
    		set_store_value(jobCriteria, $jobCriteria.location = arr, $jobCriteria);
    	}

    	

    	function handleKeyPress(e, stackType, storeObject, inputID) {
    		if (e.charCode === 13) addRequiredStack(stackType, storeObject, inputID);
    	}

    	

    	// const onKeyPressRequired = e => {
    	// 	if (e.charCode === 13) addRequiredStack();
    	// };
    	// const onKeyPressOptional = e => {
    	// 	if (e.charCode === 13) addOptionalStack();
    	// };
    	// const onKeyPressLocation = e => {
    	// 	if (e.charCode === 13) addLocation();
    	// };
    	let jobs = []; // tutaj zrobic null

    	let jobsFetched = false;

    	async function fetchJobs() {
    		set_store_value(jobCriteria, $jobCriteria.min_salary = nice(start), $jobCriteria);
    		set_store_value(jobCriteria, $jobCriteria.max_salary = nice(end), $jobCriteria);
    		let jobFetchParams = new URLSearchParams($jobCriteria).toString();
    		let jobFetchURL = new URL("/jobs?" + jobFetchParams, window.location.href);
    		const res = await fetch(jobFetchURL, { method: "GET" });
    		const json = await res.json();
    		$$invalidate(6, jobs = Object.values(json));
    		$$invalidate(7, jobsFetched = true);
    	}

    	
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		required_stack = this.value;
    		$$invalidate(3, required_stack);
    	}

    	function input1_input_handler() {
    		optional_stack = this.value;
    		$$invalidate(4, optional_stack);
    	}

    	function input2_input_handler() {
    		location = this.value;
    		$$invalidate(5, location);
    	}

    	function select_change_handler() {
    		$jobCriteria.experience = select_value(this);
    		jobCriteria.set($jobCriteria);
    	}

    	function doublerangeslider_start_binding(value) {
    		start = value;
    		$$invalidate(1, start);
    	}

    	function doublerangeslider_end_binding(value) {
    		end = value;
    		$$invalidate(2, end);
    	}

    	$$self.$capture_state = () => ({
    		DoubleRangeSlider,
    		start,
    		end,
    		formatNumber,
    		nice,
    		writable,
    		jobCriteria,
    		required_stack,
    		optional_stack,
    		location,
    		addRequiredStack,
    		addOptionalStack,
    		addLocation,
    		removeCriterionRequired,
    		removeCriterionOptional,
    		removeCriterionLocation,
    		handleKeyPress,
    		jobs,
    		jobsFetched,
    		fetchJobs,
    		$jobCriteria
    	});

    	$$self.$inject_state = $$props => {
    		if ("start" in $$props) $$invalidate(1, start = $$props.start);
    		if ("end" in $$props) $$invalidate(2, end = $$props.end);
    		if ("required_stack" in $$props) $$invalidate(3, required_stack = $$props.required_stack);
    		if ("optional_stack" in $$props) $$invalidate(4, optional_stack = $$props.optional_stack);
    		if ("location" in $$props) $$invalidate(5, location = $$props.location);
    		if ("jobs" in $$props) $$invalidate(6, jobs = $$props.jobs);
    		if ("jobsFetched" in $$props) $$invalidate(7, jobsFetched = $$props.jobsFetched);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		jobCriteria,
    		start,
    		end,
    		required_stack,
    		optional_stack,
    		location,
    		jobs,
    		jobsFetched,
    		$jobCriteria,
    		addRequiredStack,
    		removeCriterionRequired,
    		removeCriterionOptional,
    		removeCriterionLocation,
    		handleKeyPress,
    		fetchJobs,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		select_change_handler,
    		doublerangeslider_start_binding,
    		doublerangeslider_end_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { jobCriteria: 0 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get jobCriteria() {
    		return this.$$.ctx[0];
    	}

    	set jobCriteria(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
