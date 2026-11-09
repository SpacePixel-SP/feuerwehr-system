"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Qualification = {
  code: string;
  label: string;
  color: string;
};

type Member = {
  id: number;
  name: string;
  rank: string;
  functionBadge?: string;
  status: "Bereit" | "Im Einsatz" | "Außer Dienst";
  qualifications: Qualification[];
  user_id?: string | null;
};

type Profile = {
  id: string;
  email: string;
};

type Vehicle = {
  id: string;
  name: string;
  type: string;
  fmsStatus: number;
  Wache: string;
};

type UserRole = "mitglied" | "lehrgangsmeister" | "disponent" | "admin";

export default function Home() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("admin");
  const [activeTab, setActiveTab] = useState("mannschaft");
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [alarmText, setAlarmText] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newName, setNewName] = useState("");
  
  const ranksList = [
    "Feuerwehranwärter/-in",
    "Feuerwehrmann/-frau",
    "Oberfeuerwehrmann/-frau",
    "Hauptfeuerwehrmann/-frau",
    "Löschmeister/-in",
    "Oberlöschmeister/-in",
    "Hauptlöschmeister/-in",
    "Brandmeister/-in",
    "Oberbrandmeister/-in",
    "Hauptbrandmeister/-in",
  ];

  const [newRank, setNewRank] = useState(ranksList[0]);
  const [newFunctionBadge, setNewFunctionBadge] = useState("Keins");
  const [newSelectedUserId, setNewSelectedUserId] = useState<string>("");

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const [vehicles] = useState<Vehicle[]>([
    { id: "1", name: "Florian Stadt 1/44/1", type: "HLF 20", fmsStatus: 2, Wache: "Wache 1" },
    { id: "2", name: "Florian Stadt 1/33/1", type: "DLK 23/12", fmsStatus: 1, Wache: "Wache 1" },
  ]);

  const functionBadgesList = [
    "Keins",
    "Kommandant/-in",
    "stellv. Kommandant/-in",
    "Kreis- or Stadtbrandmeister/-in",
    "Kreis- oder Stadtbrandinspektor/-in",
    "Kreis- oder Stadtbrandrat/-rätin",
  ];

  const allPossibleQualifications: Qualification[] = [
    { code: "AGT", label: "Atemschutz", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { code: "MASCH", label: "Maschinist", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { code: "EHP", label: "Erste Hilfe", color: "bg-emerald-500/20 text-emerald-400 border-emerald-800" },
    { code: "GF", label: "Gruppenführer", color: "bg-amber-500/20 text-amber-400 border-amber-800" },
  ];

  // Daten aus Supabase laden
  useEffect(() => {
    async function initData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email || "Unbekannter Benutzer");

      // Mitglieder laden
      const { data: membersData } = await supabase.from("members").select("*");
      if (membersData) {
        setMembers(membersData.map(m => ({
          ...m,
          qualifications: m.qualifications || []
        })));
      }

      // Registrierte User (Profile) laden
      const { data: profilesData } = await supabase.from("profiles").select("*");
      if (profilesData) {
        setProfiles(profilesData);
      }

      setLoading(false);
    }
    initData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Verbindung zur Datenbank wird aufgebaut...</p>
      </div>
    );
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const defaultQuals = [{ code: "EHP", label: "Erste Hilfe", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }];
    
    const newEntry = {
      name: newName,
      rank: newRank,
      function_badge: newFunctionBadge !== "Keins" ? newFunctionBadge : null,
      status: "Bereit" as const,
      qualifications: defaultQuals,
      user_id: newSelectedUserId !== "" ? newSelectedUserId : null,
    };

    const { data, error } = await supabase.from("members").insert([newEntry]).select().single();

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
    } else if (data) {
      setMembers([...members, data]);
      setNewName("");
      setNewSelectedUserId("");
      setIsAddMemberOpen(false);
    }
  };

  const handleUpdateMember = async (id: number, newRankVal: string, newFuncVal: string, userIdVal: string | null) => {
    const { error } = await supabase
      .from("members")
      .update({
        rank: newRankVal,
        function_badge: newFuncVal !== "Keins" ? newFuncVal : null,
        user_id: userIdVal !== "" ? userIdVal : null,
      })
      .eq("id", id);

    if (error) {
      alert("Fehler beim Aktualisieren: " + error.message);
    } else {
      setMembers(members.map(m => m.id === id ? { 
        ...m, 
        rank: newRankVal, 
        functionBadge: newFuncVal !== "Keins" ? newFuncVal : undefined,
        user_id: userIdVal !== "" ? userIdVal : null
      } : m));
      setEditingMember(null);
    }
  };

  const handleDeleteMember = async (id: number) => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      alert("Fehler beim Löschen: " + error.message);
    } else {
      setMembers(members.filter(m => m.id !== id));
      setMemberToDelete(null);
    }
  };

  const toggleQualificationForMember = async (memberId: number, qual: Qualification) => {
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) return;

    const hasQual = targetMember.qualifications.some(q => q.code === qual.code);
    const updatedQuals = hasQual 
      ? targetMember.qualifications.filter(q => q.code !== qual.code)
      : [...targetMember.qualifications, qual];

    const { error } = await supabase
      .from("members")
      .update({ qualifications: updatedQuals })
      .eq("id", memberId);

    if (!error) {
      setMembers(members.map(m => m.id === memberId ? { ...m, qualifications: updatedQuals } : m));
    }
  };

  const getFmsBadge = (status: number) => {
    switch (status) {
      case 1: return <span className="bg-blue-950 text-blue-400 border-blue-800 px-2.5 py-1 rounded-full text-xs border font-medium">1 - Frei Funk</span>;
      case 2: return <span className="bg-emerald-950 text-emerald-400 border-emerald-800 px-2.5 py-1 rounded-full text-xs border font-medium">2 - Frei Wache</span>;
      case 3: return <span className="bg-amber-950 text-amber-400 border-amber-800 px-2.5 py-1 rounded-full text-xs border font-medium">3 - Anfahrt</span>;
      case 4: return <span className="bg-red-950 text-red-400 border-red-800 px-2.5 py-1 rounded-full text-xs border font-medium">4 - An Einsatzstelle</span>;
      default: return <span className="bg-zinc-800 text-zinc-400 border-zinc-700 px-2.5 py-1 rounded-full text-xs border font-medium">6 - Außer Dienst</span>;
    }
  };

  const navItems = [
    { id: "mannschaft", label: "Mannschaft", icon: "👥", roles: ["mitglied", "lehrgangsmeister", "disponent", "admin"] },
    { id: "benutzer", label: "Benutzerverwaltung", icon: "🔐", roles: ["admin"] },
    { id: "lehrgaenge", label: "Lehrgänge", icon: "📚", roles: ["mitglied", "lehrgangsmeister", "disponent", "admin"] },
    { id: "lehrgangsmanagement", label: "Lehrgangsmanagement", icon: "📋", roles: ["lehrgangsmeister", "admin"] },
    { id: "management", label: "Management", icon: "🛡️", roles: ["admin"] },
    { id: "fahrzeugsetup", label: "Fahrzeugsetup", icon: "🚒", roles: ["admin"] },
    { id: "leitstelle", label: "Leitstelle", icon: "📡", roles: ["mitglied", "lehrgangsmeister", "disponent", "admin"] },
    { id: "einstellungen", label: "Einstellungen & Account", icon: "⚙️", roles: ["mitglied", "lehrgangsmeister", "disponent", "admin"] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(currentUserRole));

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* SEITENLEISTE */}
      <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-lg font-bold tracking-tight text-red-500 flex items-center gap-2">
              <span>🚒</span> FFW Leitstelle
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Supabase DB aktiv</p>
          </div>

          <nav className="p-4 space-y-1.5">
            {visibleNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-red-600/10 text-red-400 border border-red-600/30 shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* USER FOOTER */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center font-bold text-red-400 text-xs shrink-0">
              {userEmail ? userEmail.substring(0, 2).toUpperCase() : "??"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate" title={userEmail}>{userEmail}</p>
              <p className="text-[10px] text-zinc-400 truncate">Eingeloggt</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Abmelden"
            className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* HAUPTBEREICH */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/40 px-8 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium">Rollen-Simulator:</span>
            <select
              value={currentUserRole}
              onChange={(e) => {
                setCurrentUserRole(e.target.value as UserRole);
                setActiveTab("mannschaft");
              }}
              className="bg-zinc-950 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 font-medium"
            >
              <option value="mitglied">🟢 Mitglied</option>
              <option value="lehrgangsmeister">🔵 Lehrgangsmeister</option>
              <option value="disponent">🟡 Disponent</option>
              <option value="admin">🔴 Admin (Wehrführung)</option>
            </select>
          </div>

          {(currentUserRole === "disponent" || currentUserRole === "admin") && (
            <button
              onClick={() => setIsAlarmModalOpen(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2 cursor-pointer"
            >
              <span>🚨</span> Alarmierung Auslösen
            </button>
          )}
        </header>

        <div className="p-8 flex-1">
          
          {/* TAB 1: MANNSCHAFT */}
          {activeTab === "mannschaft" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-zinc-400 text-sm">
                  Live-Datenbank aus Supabase. Verwalte hier Einsatzkräfte und verknüpfe sie mit User-Accounts.
                </p>
                {currentUserRole === "admin" && (
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>➕</span> Mitglied hinzufügen
                  </button>
                )}
              </div>

              {/* NEUES MITGLIED MODAL */}
              {isAddMemberOpen && currentUserRole === "admin" && (
                <div className="bg-zinc-900 border border-zinc-700 p-5 rounded-xl mb-6 shadow-xl max-w-lg">
                  <h3 className="text-md font-bold text-white mb-3">Neues Mitglied eintragen</h3>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Vor- und Nachname</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="z.B. Anna Becker"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Dienstgrad</label>
                        <select
                          value={newRank}
                          onChange={(e) => setNewRank(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          {ranksList.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Funktionsabzeichen</label>
                        <select
                          value={newFunctionBadge}
                          onChange={(e) => setNewFunctionBadge(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          {functionBadgesList.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* OPTIONALER USER-ACCOUNT BEZUG */}
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Supabase User-Account verknüpfen (Optional)</label>
                      <select
                        value={newSelectedUserId}
                        onChange={(e) => setNewSelectedUserId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="">Kein Account verknüpft</option>
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>{p.email}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsAddMemberOpen(false)} className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                      <button type="submit" className="px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white font-medium">In DB speichern</button>
                    </div>
                  </form>
                </div>
              )}

              {/* TABELLE */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-6 font-semibold">Name / Verknüpfter Account</th>
                      <th className="py-3.5 px-6 font-semibold">Dienstgrad / Funktion</th>
                      <th className="py-3.5 px-6 font-semibold">Status</th>
                      <th className="py-3.5 px-6 font-semibold">Qualifikationen</th>
                      {currentUserRole === "admin" && <th className="py-3.5 px-6 text-right font-semibold">Aktionen (Admin)</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm">
                    {members.map((member) => {
                      const linkedProfile = profiles.find(p => p.id === member.user_id);
                      return (
                        <tr key={member.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white">{member.name}</div>
                            {linkedProfile && (
                              <div className="text-xs text-blue-400 mt-0.5">🔗 {linkedProfile.email}</div>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 font-medium">
                                {member.rank}
                              </span>
                              {member.functionBadge && (
                                <span className="text-[11px] bg-amber-950/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded font-medium">
                                  ⭐ {member.functionBadge}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
                              member.status === "Bereit" ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {member.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {member.qualifications.map((qual) => (
                                <span key={qual.code} className={`text-xs px-2 py-0.5 rounded border font-medium ${qual.color}`}>
                                  {qual.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          {currentUserRole === "admin" && (
                            <td className="py-4 px-6 text-right space-x-2">
                              <button
                                onClick={() => setEditingMember(member)}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded border border-zinc-700 transition-colors"
                              >
                                ⚙️ Bearbeiten
                              </button>
                              <button
                                onClick={() => setMemberToDelete(member)}
                                className="text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/60 px-2.5 py-1.5 rounded transition-colors"
                              >
                                🗑️ Löschen
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* BEARBEITUNGS-MODAL */}
              {editingMember && currentUserRole === "admin" && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <h3 className="text-lg font-bold text-white">Mitglied bearbeiten: {editingMember.name}</h3>
                      <button onClick={() => setEditingMember(null)} className="text-zinc-400 hover:text-white">✕</button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Dienstgrad</label>
                        <select
                          id="edit-rank-select"
                          defaultValue={editingMember.rank}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          {ranksList.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Funktionsabzeichen</label>
                        <select
                          id="edit-func-select"
                          defaultValue={editingMember.functionBadge || "Keins"}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          {functionBadgesList.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Supabase User-Account verknüpfen</label>
                        <select
                          id="edit-user-select"
                          defaultValue={editingMember.user_id || ""}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          <option value="">Kein Account verknüpft</option>
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>{p.email}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-2 font-medium">Qualifikationen verwalten</label>
                        <div className="flex flex-wrap gap-2">
                          {allPossibleQualifications.map((q) => {
                            const hasIt = editingMember.qualifications.some(eq => eq.code === q.code);
                            return (
                              <button
                                key={q.code}
                                type="button"
                                onClick={() => toggleQualificationForMember(editingMember.id, q)}
                                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                                  hasIt ? "bg-red-600 text-white border-red-500 shadow" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                                }`}
                              >
                                {q.label} {hasIt ? "✓" : "+"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                      <button onClick={() => setEditingMember(null)} className="px-4 py-2 rounded-lg text-xs bg-zinc-800 text-zinc-300">Schließen</button>
                      <button
                        onClick={() => {
                          const rSelect = (document.getElementById("edit-rank-select") as HTMLSelectElement).value;
                          const fSelect = (document.getElementById("edit-func-select") as HTMLSelectElement).value;
                          const uSelect = (document.getElementById("edit-user-select") as HTMLSelectElement).value;
                          handleUpdateMember(editingMember.id, rSelect, fSelect, uSelect);
                        }}
                        className="px-4 py-2 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-bold"
                      >
                        Änderungen in DB speichern
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LÖSCHEN MODAL */}
              {memberToDelete && currentUserRole === "admin" && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-zinc-900 border border-red-900/60 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                      <span>⚠️</span> Mitglied löschen?
                    </h3>
                    <p className="text-sm text-zinc-300">
                      Möchtest du <strong className="text-white">{memberToDelete.name}</strong> wirklich aus der Datenbank entfernen?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setMemberToDelete(null)} className="px-4 py-2 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                      <button onClick={() => handleDeleteMember(memberToDelete.id)} className="px-4 py-2 rounded-lg text-xs bg-red-600 text-white font-bold">Endgültig löschen</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BENUTZERVERWALTUNG (NEU) */}
          {activeTab === "benutzer" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white">Registrierte Benutzerkonten</h2>
              <p className="text-zinc-400 text-sm">Hier siehst du alle User, die sich über die Registrierungsseite angemeldet haben.</p>
              
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm max-w-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-6 font-semibold">E-Mail-Adresse</th>
                      <th className="py-3.5 px-6 font-semibold">User-ID (Supabase)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm">
                    {profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-800/40">
                        <td className="py-4 px-6 font-medium text-white">{p.email}</td>
                        <td className="py-4 px-6 text-xs text-zinc-500 font-mono">{p.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ANDERE TABS */}
          {activeTab === "leitstelle" && (
            <div className="space-y-6">
              <p className="text-zinc-400 text-sm">Echtzeit-Übersicht der Einsatzfahrzeuge und aktueller Funkstatus.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div key={v.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-zinc-500 font-semibold">{v.Wache}</span>
                      <h3 className="font-bold text-white text-base">{v.name}</h3>
                      <p className="text-xs text-red-400 font-medium mt-0.5">{v.type}</p>
                    </div>
                    <div>{getFmsBadge(v.fmsStatus)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "lehrgaenge" && <div className="text-zinc-400 text-sm bg-zinc-900/40 p-8 rounded-xl text-center">Verfügbare Lehrgänge für Mitglieder.</div>}
          {activeTab === "lehrgangsmanagement" && <div className="text-zinc-400 text-sm bg-zinc-900/40 p-8 rounded-xl text-center">Ausbilder-Bereich: Lehrgänge erstellen und Teilnehmer prüfen.</div>}
          {activeTab === "management" && <div className="text-zinc-400 text-sm bg-zinc-900/40 p-8 rounded-xl text-center">Admin-Bereich: Wehrführung, Logs und Rechte.</div>}
          {activeTab === "fahrzeugsetup" && <div className="text-zinc-400 text-sm bg-zinc-900/40 p-8 rounded-xl text-center">Admin-Bereich: Fahrzeug-Setup und Funk-IDs.</div>}
          {activeTab === "einstellungen" && <div className="text-zinc-400 text-sm bg-zinc-900/40 p-8 rounded-xl text-center">Account-Einstellungen und Passwort.</div>}
        </div>
      </main>

      {/* ALARM MODAL */}
      {isAlarmModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-500">🚨 Leitstellen-Alarm auslösen</h3>
            <textarea
              rows={3}
              value={alarmText}
              onChange={(e) => setAlarmText(e.target.value)}
              placeholder="z.B. F 2 - Brand Gebäude..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsAlarmModalOpen(false)} className="px-4 py-2 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
              <button onClick={() => { setIsAlarmModalOpen(false); }} className="px-4 py-2 rounded-lg text-xs bg-red-600 text-white font-bold">Alarm abschicken</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}