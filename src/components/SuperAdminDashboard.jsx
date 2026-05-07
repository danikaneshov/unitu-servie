import { useState, useEffect, createElement } from "react";
import { collection, onSnapshot, addDoc, setDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db, auth, FIREBASE_API_KEY } from "../firebase";
import { signOut } from "firebase/auth";
import { LogOut, Database, Plus, Shield, Store, Users, Copy, Check, ExternalLink, UserPlus, Building } from "lucide-react";

var StatCard = function(p) {
  return createElement("div", { className: "bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.07] transition-all" },
    createElement("div", { className: "w-12 h-12 rounded-xl flex items-center justify-center " + p.color }, createElement(p.icon, { size: 22 })),
    createElement("div", null,
      createElement("p", { className: "text-xs text-slate-400 font-bold uppercase tracking-wider" }, p.label),
      createElement("p", { className: "text-2xl font-black text-white" }, p.value)
    )
  );
};

var SuperAdminDashboard = function() {
  var _users = useState([]); var users = _users[0]; var setUsers = _users[1];
  var _outlets = useState([]); var outlets = _outlets[0]; var setOutlets = _outlets[1];
  var _loading = useState(true); var loading = _loading[0]; var setLoading = _loading[1];
  var _error = useState(null); var error = _error[0]; var setError = _error[1];
  var _section = useState("overview"); var activeSection = _section[0]; var setActiveSection = _section[1];
  var _newUser = useState({ email: "", password: "", role: "admin" }); var newUser = _newUser[0]; var setNewUser = _newUser[1];
  var _newOutlet = useState({ name: "", slug: "", ownerUid: "", address: "" }); var newOutlet = _newOutlet[0]; var setNewOutlet = _newOutlet[1];
  var _creatingUser = useState(false); var isCreatingUser = _creatingUser[0]; var setIsCreatingUser = _creatingUser[1];
  var _creatingOutlet = useState(false); var isCreatingOutlet = _creatingOutlet[0]; var setIsCreatingOutlet = _creatingOutlet[1];
  var _copied = useState(null); var copiedSlug = _copied[0]; var setCopiedSlug = _copied[1];

  useEffect(function() {
    var u1 = onSnapshot(collection(db, "users"),
      function(s) { setUsers(s.docs.map(function(d) { return { id: d.id, ...d.data() }; })); },
      function(e) { console.error(e); setError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438: " + e.message); }
    );
    var u2 = onSnapshot(collection(db, "outlets"),
      function(s) { setOutlets(s.docs.map(function(d) { return { id: d.id, ...d.data() }; })); setLoading(false); },
      function(e) { console.error(e); setError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438: " + e.message); }
    );
    return function() { u1(); u2(); };
  }, []);

  useEffect(function() {
    if (loading) { var t = setTimeout(function() { setLoading(false); }, 5000); return function() { clearTimeout(t); }; }
  }, [loading]);

  var handleCreateUser = async function(ev) {
    ev.preventDefault(); setIsCreatingUser(true);
    try {
      var r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + FIREBASE_API_KEY, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUser.email, password: newUser.password, returnSecureToken: false })
      });
      var d = await r.json();
      if (!r.ok) throw new Error(d.error.message || "\u041E\u0448\u0438\u0431\u043A\u0430");
      await setDoc(doc(db, "users", d.localId), {
        uid: d.localId, email: newUser.email, role: newUser.role, createdAt: new Date().toISOString()
      });
      setNewUser({ email: "", password: "", role: "admin" });
      alert("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441\u043E\u0437\u0434\u0430\u043D!");
    } catch (e) { alert("\u041E\u0448\u0438\u0431\u043A\u0430: " + e.message); }
    finally { setIsCreatingUser(false); }
  };

  var handleCreateOutlet = async function(ev) {
    ev.preventDefault();
    if (!newOutlet.ownerUid) return alert("\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0430");
    if (!/^[a-z0-9-]+$/.test(newOutlet.slug)) return alert("Slug: \u0442\u043E\u043B\u044C\u043A\u043E \u043B\u0430\u0442\u0438\u043D\u0438\u0446\u0430, \u0446\u0438\u0444\u0440\u044B, \u0434\u0435\u0444\u0438\u0441");
    if (outlets.filter(function(o) { return o.ownerUid === newOutlet.ownerUid; }).length >= 2) return alert("\u041B\u0438\u043C\u0438\u0442: 2 \u0442\u043E\u0447\u043A\u0438");
    setIsCreatingOutlet(true);
    try {
      await addDoc(collection(db, "outlets"), {
        ownerUid: newOutlet.ownerUid, slug: newOutlet.slug, name: newOutlet.name, address: newOutlet.address,
        createdAt: new Date().toISOString(),
        settings: { baseSalary: 3000, partnerBaseSalary: 1500, itemCommission: 1500, partnerItemCommission: 1500 }
      });
      setNewOutlet({ name: "", slug: "", ownerUid: "", address: "" });
      alert("\u0422\u043E\u0447\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0430!");
    } catch (e) { alert("\u041E\u0448\u0438\u0431\u043A\u0430: " + e.message); }
    finally { setIsCreatingOutlet(false); }
  };

  var runMigration = async function() {
    if (!window.confirm("\u041F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u0441\u0442\u0430\u0440\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043A \u0442\u043E\u0447\u043A\u0435?")) return;
    var oid = prompt("ID \u0442\u043E\u0447\u043A\u0438:"); if (!oid) return;
    try {
      var cols = ["employees", "sales", "inventory_movements", "inventory_templates"];
      for (var i = 0; i < cols.length; i++) {
        var colName = cols[i];
        var snap = await getDocs(collection(db, colName));
        await Promise.all(
          snap.docs.map(function(ds) {
            if (ds.data().outletId) return Promise.resolve();
            return updateDoc(doc(db, colName, ds.id), { outletId: oid });
          })
        );
      }
      alert("\u041C\u0438\u0433\u0440\u0430\u0446\u0438\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430");
    } catch (e) { alert("\u041E\u0448\u0438\u0431\u043A\u0430: " + e.message); }
  };

  var baseUrl = window.location.origin + "/";

  if (loading) return createElement("div", { className: "fixed inset-0 bg-[#080C14] flex items-center justify-center z-50" },
    createElement("div", { className: "text-center" },
      createElement("div", { className: "w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }),
      createElement("p", { className: "text-slate-400 font-medium" }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0430\u043D\u0435\u043B\u0438...")
    )
  );
  if (error) return createElement("div", { className: "fixed inset-0 bg-[#080C14] flex flex-col items-center justify-center text-white p-8 z-50" },
    createElement("p", { className: "text-red-400 font-bold text-lg mb-4" }, error),
    createElement("button", { className: "px-6 py-3 bg-blue-600 text-white rounded-xl font-bold",
      onClick: function() { setError(null); setLoading(true); setTimeout(function() { setLoading(false); }, 100); }
    }, "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C")
  );

  return createElement("div", { className: "fixed inset-0 bg-[#080C14] overflow-auto font-sans text-slate-300" },
    createElement("div", { className: "absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden" },
      createElement("div", { className: "absolute -top-40 -right-40 w-96 h-96 bg-blue-600/5 blur-[150px] rounded-full" }),
      createElement("div", { className: "absolute top-60 right-20 w-80 h-80 bg-violet-600/5 blur-[150px] rounded-full" })
    ),
    createElement("div", { className: "max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8 relative z-10" },
      createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8" },
        createElement("div", null,
          createElement("h1", { className: "text-3xl font-black text-white tracking-tight" },
            "Unitu", createElement("span", { className: "text-blue-500" }, "."),
            createElement("span", { className: "text-slate-500 font-medium text-lg ml-2" }, "\u041F\u0430\u043D\u0435\u043B\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F")
          )
        ),
        createElement("div", { className: "flex gap-2" },
          createElement("button", { className: "flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-bold hover:bg-amber-500/20 transition-all", onClick: runMigration },
            createElement(Database, { size: 16 }), " \u041C\u0438\u0433\u0440\u0430\u0446\u0438\u044F"
          ),
          createElement("button", { className: "flex items-center gap-2 px-4 py-2.5 bg-white/5 text-slate-400 border border-white/10 rounded-xl text-sm font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all",
            onClick: function() { signOut(auth); }
          }, createElement(LogOut, { size: 16 }), " \u0412\u044B\u0439\u0442\u0438")
        )
      ),
      createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" },
        createElement(StatCard, { icon: Users, label: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438", value: users.length, color: "bg-blue-500/20 text-blue-400" }),
        createElement(StatCard, { icon: Store, label: "\u0422\u043E\u0447\u043A\u0438", value: outlets.length, color: "bg-indigo-500/20 text-indigo-400" }),
        createElement(StatCard, { icon: Shield, label: "\u0421\u0443\u043F\u0435\u0440\u0430\u0434\u043C\u0438\u043D\u044B", value: users.filter(function(u) { return u.role === "superadmin"; }).length, color: "bg-amber-500/20 text-amber-400" }),
        createElement(StatCard, { icon: Building, label: "\u0412\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u044B", value: users.filter(function(u) { return u.role === "admin"; }).length, color: "bg-emerald-500/20 text-emerald-400" })
      ),
      createElement("div", { className: "flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1 mb-8 w-fit" },
        [{ k: "overview", i: Store, l: "\u041E\u0431\u0437\u043E\u0440" }, { k: "users", i: UserPlus, l: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438" }, { k: "outlets", i: Building, l: "\u0422\u043E\u0447\u043A\u0438" }].map(function(t) {
          return createElement("button", {
            key: t.k, onClick: function() { setActiveSection(t.k); },
            className: "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all " + (activeSection === t.k ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "text-slate-400 hover:text-white hover:bg-white/5")
          }, createElement(t.i, { size: 16 }), " " + t.l);
        })
      ),
      activeSection === "overview" && createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
        createElement("div", { className: "bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 lg:p-8" },
          createElement("div", { className: "flex items-center gap-3 mb-6" },
            createElement("div", { className: "w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400" }, createElement(UserPlus, { size: 20 })),
            createElement("h2", { className: "text-lg font-bold text-white" }, "\u041D\u043E\u0432\u044B\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C")
          ),
          createElement("form", { className: "space-y-4", onSubmit: handleCreateUser },
            createElement("input", { type: "email", placeholder: "email@example.com", required: true, value: newUser.email,
              className: "w-full p-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm",
              onChange: function(ev) { setNewUser({...newUser, email: ev.target.value}); }
            }),
            createElement("input", { type: "password", placeholder: "\u041F\u0430\u0440\u043E\u043B\u044C", required: true, value: newUser.password,
              className: "w-full p-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm",
              onChange: function(ev) { setNewUser({...newUser, password: ev.target.value}); }
            }),
            createElement("select", { value: newUser.role,
              className: "w-full p-3.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm appearance-none",
              onChange: function(ev) { setNewUser({...newUser, role: ev.target.value}); }
            },
              createElement("option", { className: "bg-slate-900", value: "admin" }, "\u0412\u043B\u0430\u0434\u0435\u043B\u0435\u0446 \u0442\u043E\u0447\u043A\u0438"),
              createElement("option", { className: "bg-slate-900", value: "superadmin" }, "\u0421\u0443\u043F\u0435\u0440 \u0410\u0434\u043C\u0438\u043D")
            ),
            createElement("button", { type: "submit", disabled: isCreatingUser,
              className: "w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            }, isCreatingUser ? "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435..." : "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C")
          )
        ),
        createElement("div", { className: "bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 lg:p-8" },
          createElement("div", { className: "flex items-center gap-3 mb-6" },
            createElement("div", { className: "w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400" }, createElement(Plus, { size: 20 })),
            createElement("h2", { className: "text-lg font-bold text-white" }, "\u041D\u043E\u0432\u0430\u044F \u0442\u043E\u0447\u043A\u0430")
          ),
          createElement("form", { className: "space-y-4", onSubmit: handleCreateOutlet },
            createElement("select", { required: true, value: newOutlet.ownerUid,
              className: "w-full p-3.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm appearance-none",
              onChange: function(ev) { setNewOutlet({...newOutlet, ownerUid: ev.target.value}); }
            },
              createElement("option", { className: "bg-slate-900", value: "" }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0430"),
              users.filter(function(u) { return u.role === "admin"; }).map(function(u) {
                return createElement("option", { key: u.id, className: "bg-slate-900", value: u.uid || u.id }, u.email);
              })
            ),
            createElement("div", { className: "grid grid-cols-2 gap-3" },
              createElement("input", { type: "text", placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", required: true, value: newOutlet.name,
                className: "p-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm",
                onChange: function(ev) { setNewOutlet({...newOutlet, name: ev.target.value}); }
              }),
              createElement("input", { type: "text", placeholder: "slug", required: true, value: newOutlet.slug,
                className: "p-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm",
                onChange: function(ev) { setNewOutlet({...newOutlet, slug: ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")}); }
              })
            ),
            createElement("input", { type: "text", placeholder: "\u0410\u0434\u0440\u0435\u0441 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", value: newOutlet.address,
              className: "w-full p-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm",
              onChange: function(ev) { setNewOutlet({...newOutlet, address: ev.target.value}); }
            }),
            createElement("button", { type: "submit", disabled: isCreatingOutlet,
              className: "w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            }, isCreatingOutlet ? "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435..." : "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0442\u043E\u0447\u043A\u0443")
          )
        )
      ),
      activeSection === "users" && createElement("div", { className: "bg-white/[0.03] border border-white/[0.06] rounded-3xl overflow-hidden" },
        createElement("div", { className: "p-6 lg:p-8 border-b border-white/[0.05] flex justify-between items-center" },
          createElement("h2", { className: "text-lg font-bold text-white" }, "\u0412\u0441\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438"),
          createElement("span", { className: "text-xs text-slate-500 font-mono" }, users.length + " \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u043E\u0432")
        ),
        createElement("div", { className: "divide-y divide-white/[0.04]" },
          users.length === 0
            ? createElement("p", { className: "text-slate-500 text-center py-16" }, "\u041D\u0435\u0442 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439")
            : users.map(function(u) {
                var oc = outlets.filter(function(o) { return o.ownerUid === (u.uid || u.id); }).length;
                return createElement("div", { key: u.id, className: "p-5 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.02] transition-colors" },
                  createElement("div", { className: "flex items-center gap-4" },
                    createElement("div", { className: "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm " + (u.role === "superadmin" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400") },
                      u.email ? u.email[0].toUpperCase() : "?"
                    ),
                    createElement("div", null,
                      createElement("p", { className: "font-bold text-white text-sm" }, u.email || "\u0411\u0435\u0437 email"),
                      createElement("span", { className: "inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full " + (u.role === "superadmin" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20") },
                        u.role === "superadmin" ? "\u0421\u0443\u043F\u0435\u0440\u0430\u0434\u043C\u0438\u043D" : "\u0412\u043B\u0430\u0434\u0435\u043B\u0435\u0446")
                    )
                  ),
                  createElement("div", { className: "flex items-center gap-3" },
                    createElement("span", { className: "text-xs text-slate-500 font-mono bg-black/30 px-3 py-1.5 rounded-lg" }, (u.uid || u.id).substring(0, 12)),
                    oc > 0 && createElement("span", { className: "text-xs text-slate-400" }, oc + (oc === 1 ? " \u0442\u043E\u0447\u043A\u0430" : oc < 5 ? " \u0442\u043E\u0447\u043A\u0438" : " \u0442\u043E\u0447\u0435\u043A"))
                  )
                );
              })
        )
      ),
      activeSection === "outlets" && createElement("div", { className: "bg-white/[0.03] border border-white/[0.06] rounded-3xl overflow-hidden" },
        createElement("div", { className: "p-6 lg:p-8 border-b border-white/[0.05] flex justify-between items-center" },
          createElement("h2", { className: "text-lg font-bold text-white" }, "\u0412\u0441\u0435 \u0442\u043E\u0447\u043A\u0438"),
          createElement("span", { className: "text-xs text-slate-500 font-mono" }, outlets.length + " \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445")
        ),
        createElement("div", { className: "divide-y divide-white/[0.04]" },
          outlets.length === 0
            ? createElement("p", { className: "text-slate-500 text-center py-16" }, "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0442\u043E\u0447\u0435\u043A")
            : outlets.map(function(o) {
                var ow = users.find(function(u) { return (u.uid || u.id) === o.ownerUid; });
                var url = baseUrl + o.slug;
                return createElement("div", { key: o.id, className: "p-5 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.02] transition-colors" },
                  createElement("div", { className: "flex items-center gap-4" },
                    createElement("div", { className: "w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm" },
                      o.name ? o.name[0].toUpperCase() : "?"
                    ),
                    createElement("div", null,
                      createElement("p", { className: "font-bold text-white text-sm" }, o.name || "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F"),
                      createElement("div", { className: "flex gap-2 mt-1" },
                        createElement("span", { className: "px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full" }, "/" + o.slug),
                        o.address && createElement("span", { className: "text-xs text-slate-500 truncate max-w-[150px]" }, o.address)
                      )
                    )
                  ),
                  createElement("div", { className: "flex items-center gap-2" },
                    createElement("span", { className: "text-xs text-slate-500" }, ow ? ow.email : "\u041D\u0435\u0442 \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0430"),
                    createElement("button", { title: url, className: "flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 rounded-lg text-xs font-medium transition-all",
                      onClick: function() { navigator.clipboard.writeText(url); setCopiedSlug(o.id); setTimeout(function() { setCopiedSlug(null); }, 1500); }
                    },
                      copiedSlug === o.id ? createElement(Check, { size: 14, className: "text-emerald-400" }) : createElement(Copy, { size: 14 }),
                      createElement("span", { className: "hidden sm:inline truncate max-w-[140px]" }, o.slug)
                    ),
                    createElement("a", { className: "p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all", href: url, target: "_blank", rel: "noreferrer" },
                      createElement(ExternalLink, { size: 16 })
                    )
                  )
                );
              })
        )
      )
    )
  );
};

export default SuperAdminDashboard;
