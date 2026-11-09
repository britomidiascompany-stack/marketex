(function(){
  var DATA = window.__DASH_DATA || {}, BASE = window.__DASH_PARAMS || {};
  var params = Object.assign({}, BASE), draws = new Map(), onDataFns = [], scheduled = false;
  function visible(el){ return el.isConnected && !el.closest('[hidden]'); }
  function els(name){ return Array.prototype.slice.call(document.querySelectorAll('[data-draw="' + name + '"]')); }
  function runOne(name){ var fn = draws.get(name); if (!fn) return; els(name).forEach(function(el){ if (!visible(el)) return; try { fn(el); } catch (e) { console.error('[draw ' + name + ']', e); } }); }
  function runAll(){ scheduled = false; onDataFns.forEach(function(f){ try { f(); } catch (e) { console.error(e); } }); draws.forEach(function(_, n){ runOne(n); }); }
  function schedule(){ if (!scheduled) { scheduled = true; setTimeout(runAll, 0); } }
  window.dash = {
    data: function(id){ var d = DATA[id]; if (!d) return { status: 'missing', data: [], columns: [], meta: [] };
      return { status: 'ok', data: d, columns: d.length ? Object.keys(d[0]) : [], meta: [], refreshing: false, rows: d }; },
    draw: function(name, fn){ if (fn === undefined) { runOne(name); return; } draws.set(name, fn); schedule(); },
    onData: function(fn){ onDataFns.push(fn); schedule(); },
    params: function(){ return Object.assign({}, params); },
    setParams: function(o){ Object.keys(o || {}).forEach(function(k){ if (o[k] === null) delete params[k]; else params[k] = o[k]; }); schedule(); },
    resetParams: function(){ params = Object.assign({}, BASE); schedule(); },
    setLink: function(name){ try { history.replaceState(null, '', '#' + name); } catch (e) {} schedule(); },
    refresh: function(){ schedule(); },
    colors: ['#7C3AED', '#A78BFA', '#16A34A', '#DC2626', '#D97706', '#3B0F73', '#C9BDEB', '#5B5566']
  };
  var w = window.innerWidth;
  window.addEventListener('resize', function(){ if (window.innerWidth !== w) { w = window.innerWidth; schedule(); } });
})();
