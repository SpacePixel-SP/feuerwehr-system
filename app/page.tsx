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
  function_badge?: string;
  status: "Bereit" | "Im Einsatz" | "Außer Dienst";
  qualifications: Qualification[];
  user_id?: string | null;
};

type Profile = {
  id: string;
  email: string;
  role: UserRole | null;
};

type Course = {
  id: number;
  title: string;
  instructor: string;
  description: string;
  qualification_code: string;
  max_participants: number;
  internal_notes: string;
  min_rank: string;
  scheduled_at: string;
  actual_at?: string | null;
  status: "Planungsphase" | "Bestätigt" | "Anmeldungen Geschlossen" | "Läuft" | "Abgeschlossen";
};

type CourseRegistration = {
  id: number;
  course_id: number;
  member_id: number;
  is_waitlist: boolean;
  passed: boolean | null;
  registered_at: string;
  members?: Member;
};

type CourseFeedback = {
  id: number;
  registration_id: number;
  author: string;
  note: string;
  created_at: string;
};

type Exercise = {
  id: number;
  title: string;
  instructor: string;
  description: string;
  max_participants: number;
  min_rank: string;
  scheduled_at: string;
  actual_at?: string | null;
  status: "Planungsphase" | "Bestätigt" | "Läuft" | "Abgeschlossen";
};

type ExerciseRegistration = {
  id: number;
  exercise_id: number;
  member_id: number;
  is_waitlist: boolean;
  attended: boolean;
  registered_at: string;
  members?: Member;
};

type Vehicle = {
  id: number;
  name: string;
  type: string;
  fms_status: number;
  wache: string;
};

type VehicleReport = {
  id: number;
  vehicle_id: number;
  reporter: string;
  report_type: "beschädigung" | "verbrauch";
  description: string;
  created_at: string;
};

type VehicleTypePool = {
  id: number;
  name: string;
};

type DispatchKeyword = {
  id: number;
  code: string;
  title: string;
  category: string;
};

type Operation = {
  id: number;
  keyword: string;
  alarm_level: string;
  address: string;
  vehicles: string[];
  sosi: boolean;
  description: string;
  caller: string;
  status: "Aktiv" | "Abgeschlossen";
  created_at: string;
};

type OperationParticipant = {
  id: number;
  operation_id: number;
  member_id: number;
  members?: Member;
};

type UserRole = "mitglied" | "maschinist" | "lehrgangsmeister" | "disponent" | "admin";

export default function Home() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState("mannschaft");
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [feedbacks, setFeedbacks] = useState<CourseFeedback[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseRegistrations, setExerciseRegistrations] = useState<ExerciseRegistration[]>([]);
  const [qualificationsPool, setQualificationsPool] = useState<Qualification[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleReports, setVehicleReports] = useState<VehicleReport[]>([]);
  const [vehicleTypesPool, setVehicleTypesPool] = useState<VehicleTypePool[]>([]);
  const [dispatchKeywords, setDispatchKeywords] = useState<DispatchKeyword[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operationParticipants, setOperationParticipants] = useState<OperationParticipant[]>([]);

  // Alarmierungs-Formular States
  const [alarmKeyword, setAlarmKeyword] = useState("");
  const [alarmLevel, setAlarmLevel] = useState("Alarmstufe 1");
  const [alarmAddress, setAlarmAddress] = useState("");
  const [alarmSelectedVehicles, setAlarmSelectedVehicles] = useState<string[]>([]);
  const [alarmSosi, setAlarmSosi] = useState(true);
  const [alarmDescription, setAlarmDescription] = useState("");
  const [alarmCaller, setAlarmCaller] = useState("");

  // Mitglied States
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRank, setNewRank] = useState("Feuerwehranwärter/-in");
  const [newFunctionBadge, setNewFunctionBadge] = useState("Keins");
  const [newSelectedUserId, setNewSelectedUserId] = useState<string>("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState("");
  const [editRank, setEditRank] = useState("");
  const [editFuncBadge, setEditFuncBadge] = useState("");
  const [editUserId, setEditUserId] = useState<string>("");
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Qualifikation States
  const [newQualCode, setNewQualCode] = useState("");
  const [newQualLabel, setNewQualLabel] = useState("");
  const [newQualColor, setNewQualColor] = useState("bg-red-500/20 text-red-400 border-red-500/30");

  // Fahrzeug Setup States
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("HLF 20");
  const [newVehicleWache, setNewVehicleWache] = useState("Wache 1");
  const [newVehicleTypeName, setNewVehicleTypeName] = useState("");

  // Maschinist / Schadensbericht States
  const [selectedVehicleForReport, setSelectedVehicleForReport] = useState<Vehicle | null>(null);
  const [reportType, setReportType] = useState<"beschädigung" | "verbrauch">("beschädigung");
  const [reportDescription, setReportDescription] = useState("");

  // Lehrgang States
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: "", instructor: "", description: "", qualification_code: "AGT", max_participants: 10, internal_notes: "", min_rank: "Feuerwehranwärter/-in", scheduled_at: "", actual_at: "",
  });
  const [newFeedbackNote, setNewFeedbackNote] = useState<{ [key: number]: string }>({});

  // Übungs States
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [newExercise, setNewExercise] = useState({
    title: "", instructor: "", description: "", max_participants: 20, min_rank: "Feuerwehranwärter/-in", scheduled_at: "", actual_at: "",
  });

  const ranksList = [
    "Feuerwehranwärter/-in", "Feuerwehrmann/-frau", "Oberfeuerwehrmann/-frau", "Hauptfeuerwehrmann/-frau",
    "Löschmeister/-in", "Oberlöschmeister/-in", "Hauptlöschmeister/-in", "Brandmeister/-in", "Oberbrandmeister/-in", "Hauptbrandmeister/-in",
  ];

  const functionBadgesList = [
    "Keins", "Kommandant/-in", "stellv. Kommandant/-in", "Kreis- oder Stadtbrandmeister/-in", "Kreis- oder Stadtbrandinspektor/-in", "Kreis- oder Stadtbrandrat/-rätin",
  ];

  const colorOptions = [
    { label: "Rot (Atemschutz / Gefahr)", value: "bg-red-500/20 text-red-400 border-red-500/30" },
    { label: "Blau (Technik / Maschinist)", value: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { label: "Grün (Sanitäter / Erste Hilfe)", value: "bg-emerald-500/20 text-emerald-400 border-emerald-800" },
    { label: "Gelb / Amber (Führung)", value: "bg-amber-500/20 text-amber-400 border-amber-800" },
    { label: "Lila (Spezial)", value: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  ];

  const loadData = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push("/login");
      return;
    }
    setUserEmail(user.email || "Unbekannter Benutzer");

    const { data: profData } = await supabase.from("profiles").select("*");
    if (profData) {
      setProfiles(profData);
      const currentProf = profData.find(p => p.id === user.id);
      setUserRole(currentProf?.role || null);
    }

    const { data: memData } = await supabase.from("members").select("*");
    if (memData) setMembers(memData.map(m => ({ ...m, qualifications: m.qualifications || [] })));

    const { data: qualData } = await supabase.from("qualifications_pool").select("*");
    if (qualData) setQualificationsPool(qualData);

    const { data: vehData } = await supabase.from("vehicles").select("*");
    if (vehData) setVehicles(vehData);

    const { data: repData } = await supabase.from("vehicle_reports").select("*").order("created_at", { ascending: false });
    if (repData) setVehicleReports(repData);

    const { data: vtData } = await supabase.from("vehicle_types_pool").select("*");
    if (vtData) {
      setVehicleTypesPool(vtData);
      if (vtData.length > 0 && !newVehicleType) setNewVehicleType(vtData[0].name);
    }

    const { data: dkData } = await supabase.from("dispatch_keywords").select("*");
    if (dkData) {
      setDispatchKeywords(dkData);
      if (dkData.length > 0 && !alarmKeyword) setAlarmKeyword(`${dkData[0].code}: ${dkData[0].title}`);
    }

    const { data: opData } = await supabase.from("operations").select("*").order("created_at", { ascending: false });
    if (opData) setOperations(opData);

    const { data: opPartData } = await supabase.from("operation_participants").select("*, members(*)");
    if (opPartData) setOperationParticipants(opPartData as any);

    const { data: courseData } = await supabase.from("courses").select("*").order("scheduled_at", { ascending: true });
    if (courseData) setCourses(courseData);

    const { data: regData } = await supabase.from("course_registrations").select("*, members(*)");
    if (regData) setRegistrations(regData as any);

    const { data: fbData } = await supabase.from("course_feedback").select("*");
    if (fbData) setFeedbacks(fbData);

    const { data: exData } = await supabase.from("exercises").select("*").order("scheduled_at", { ascending: true });
    if (exData) setExercises(exData);

    const { data: exRegData } = await supabase.from("exercise_registrations").select("*, members(*)");
    if (exRegData) setExerciseRegistrations(exRegData as any);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAssignRole = async (targetUserId: string, newRole: UserRole | "null") => {
    const roleVal = newRole === "null" ? null : newRole;
    const { error } = await supabase.from("profiles").update({ role: roleVal }).eq("id", targetUserId);
    if (!error) {
      setProfiles(profiles.map(p => p.id === targetUserId ? { ...p, role: roleVal as any } : p));
    }
  };

  // Mitglieder CRUD
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const defaultQuals = qualificationsPool.slice(0, 1);
    const newEntry = {
      name: newName, rank: newRank, function_badge: newFunctionBadge !== "Keins" ? newFunctionBadge : null,
      status: "Bereit" as const, qualifications: defaultQuals, user_id: newSelectedUserId !== "" ? newSelectedUserId : null,
    };
    const { data, error } = await supabase.from("members").insert([newEntry]).select().single();
    if (!error && data) {
      setMembers([...members, data]);
      setNewName(""); setNewSelectedUserId(""); setIsAddMemberOpen(false);
    }
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setEditName(member.name); setEditRank(member.rank);
    setEditFuncBadge(member.function_badge || "Keins"); setEditUserId(member.user_id || "");
  };

  const handleSaveEditMember = async () => {
    if (!editingMember) return;
    const { error } = await supabase.from("members").update({
      name: editName, rank: editRank,
      function_badge: editFuncBadge !== "Keins" ? editFuncBadge : null,
      user_id: editUserId !== "" ? editUserId : null,
    }).eq("id", editingMember.id);

    if (!error) {
      setMembers(members.map(m => m.id === editingMember.id ? {
        ...m, name: editName, rank: editRank,
        function_badge: editFuncBadge !== "Keins" ? editFuncBadge : undefined, user_id: editUserId !== "" ? editUserId : null,
      } : m));
      setEditingMember(null);
    }
  };

  const handleDeleteMember = async (id: number) => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (!error) {
      setMembers(members.filter(m => m.id !== id));
      setMemberToDelete(null);
    }
  };

  const toggleQualificationForMember = async (memberId: number, qual: Qualification) => {
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) return;
    const hasQual = targetMember.qualifications.some(q => q.code === qual.code);
    const updatedQuals = hasQual ? targetMember.qualifications.filter(q => q.code !== qual.code) : [...targetMember.qualifications, qual];

    const { error } = await supabase.from("members").update({ qualifications: updatedQuals }).eq("id", memberId);
    if (!error) {
      setMembers(members.map(m => m.id === memberId ? { ...m, qualifications: updatedQuals } : m));
      if (editingMember && editingMember.id === memberId) setEditingMember({ ...editingMember, qualifications: updatedQuals });
    }
  };

  // Qualifikationen Pool (inkl. automatischer Bereinigung bei Mitgliedern)
  const handleCreateQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQualCode || !newQualLabel) return;
    const { data, error } = await supabase.from("qualifications_pool").insert([{
      code: newQualCode.toUpperCase(), label: newQualLabel, color: newQualColor
    }]).select().single();
    if (!error && data) {
      setQualificationsPool([...qualificationsPool, data]);
      setNewQualCode(""); setNewQualLabel("");
    } else {
      alert("Fehler: " + error?.message);
    }
  };

  const handleDeleteQualification = async (code: string) => {
    if (!confirm(`Möchtest du die Qualifikation "${code}" wirklich löschen? Sie wird dadurch automatisch bei allen Mitgliedern entfernt.`)) return;

    const { error } = await supabase.from("qualifications_pool").delete().eq("code", code);
    if (!error) {
      setQualificationsPool(qualificationsPool.filter(q => q.code !== code));

      // Automatisch bei allen Mitgliedern entfernen, die diese Qualifikation hatten
      const updatedMembers = await Promise.all(
        members.map(async (m) => {
          const hasIt = m.qualifications.some(q => q.code === code);
          if (hasIt) {
            const newQuals = m.qualifications.filter(q => q.code !== code);
            await supabase.from("members").update({ qualifications: newQuals }).eq("id", m.id);
            return { ...m, qualifications: newQuals };
          }
          return m;
        })
      );
      setMembers(updatedMembers);
    } else {
      alert("Fehler beim Löschen: " + error.message);
    }
  };

  // Fahrzeugtypen & Fuhrpark
  const handleAddVehicleType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleTypeName) return;
    const { data, error } = await supabase.from("vehicle_types_pool").insert([{ name: newVehicleTypeName }]).select().single();
    if (!error && data) {
      setVehicleTypesPool([...vehicleTypesPool, data]);
      setNewVehicleTypeName("");
    } else {
      alert("Fehler: " + error?.message);
    }
  };

  const handleDeleteVehicleType = async (id: number) => {
    const { error } = await supabase.from("vehicle_types_pool").delete().eq("id", id);
    if (!error) {
      setVehicleTypesPool(vehicleTypesPool.filter(vt => vt.id !== id));
    } else {
      alert("Fehler beim Löschen: " + error.message);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleName) return;
    const { data, error } = await supabase.from("vehicles").insert([{
      name: newVehicleName, type: newVehicleType, fms_status: 2, wache: newVehicleWache
    }]).select().single();
    if (!error && data) {
      setVehicles([...vehicles, data]);
      setNewVehicleName("");
      setIsAddVehicleOpen(false);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (!error) setVehicles(vehicles.filter(v => v.id !== id));
  };

  const handleUpdateFmsStatus = async (vehicleId: number, newStatus: number) => {
    const { error } = await supabase.from("vehicles").update({ fms_status: newStatus }).eq("id", vehicleId);
    if (!error) {
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, fms_status: newStatus } : v));
    }
  };

  // Fahrzeugmeldungen
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForReport || !reportDescription) return;

    const { data, error } = await supabase.from("vehicle_reports").insert([{
      vehicle_id: selectedVehicleForReport.id,
      reporter: userEmail,
      report_type: reportType,
      description: reportDescription
    }]).select().single();

    if (!error && data) {
      setVehicleReports([data, ...vehicleReports]);
      setReportDescription("");
      setSelectedVehicleForReport(null);
      alert("Meldung erfolgreich eingetragen!");
    } else {
      alert("Fehler beim Speichern: " + error?.message);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    const { error } = await supabase.from("vehicle_reports").delete().eq("id", reportId);
    if (!error) {
      setVehicleReports(vehicleReports.filter(r => r.id !== reportId));
    } else {
      alert("Fehler beim Löschen: " + error.message);
    }
  };

  // Alarmierung & Einsatzprotokoll Teilnehmer
  const handleTriggerAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alarmKeyword || !alarmAddress) return;

    const { data, error } = await supabase.from("operations").insert([{
      keyword: alarmKeyword,
      alarm_level: alarmLevel,
      address: alarmAddress,
      vehicles: alarmSelectedVehicles,
      sosi: alarmSosi,
      description: alarmDescription,
      caller: alarmCaller || userEmail,
      status: "Aktiv"
    }]).select().single();

    if (!error && data) {
      setOperations([data, ...operations]);
      setIsAlarmModalOpen(false);
      setAlarmAddress("");
      setAlarmDescription("");
      setAlarmCaller("");
      setAlarmSelectedVehicles([]);
      alert("🚨 Einsatz erfolgreich alarmiert!");
    } else {
      alert("Fehler beim Alarmieren: " + error?.message);
    }
  };

  const handleCloseOperation = async (opId: number) => {
    const { error } = await supabase.from("operations").update({ status: "Abgeschlossen" }).eq("id", opId);
    if (!error) {
      setOperations(operations.map(o => o.id === opId ? { ...o, status: "Abgeschlossen" } : o));
    }
  };

  const handleJoinOperation = async (opId: number) => {
    const currentMember = members.find(m => m.user_id && profiles.find(p => p.email === userEmail)?.id === m.user_id);
    if (!currentMember) {
      alert("Dein User-Account ist noch keinem Mannschaftsmitglied zugewiesen.");
      return;
    }

    const { data, error } = await supabase.from("operation_participants").insert([{
      operation_id: opId,
      member_id: currentMember.id
    }]).select("*, members(*)").single();

    if (!error && data) {
      setOperationParticipants([...operationParticipants, data as any]);
      alert("Erfolgreich als Teilnehmer eingetragen!");
    } else {
      alert("Du stehst bereits in der Teilnehmerliste dieses Einsatzes.");
    }
  };

  const handleRemoveOperationParticipant = async (partId: number) => {
    const { error } = await supabase.from("operation_participants").delete().eq("id", partId);
    if (!error) {
      setOperationParticipants(operationParticipants.filter(p => p.id !== partId));
    }
  };

  // Lehrgänge (inkl. Löschen & Zertifikat-Bild-Download mit neutralem Feuerwehr-Header)
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from("courses").insert([{
      title: newCourse.title, instructor: newCourse.instructor, description: newCourse.description,
      qualification_code: newCourse.qualification_code, max_participants: newCourse.max_participants,
      internal_notes: newCourse.internal_notes, min_rank: newCourse.min_rank,
      scheduled_at: newCourse.scheduled_at, actual_at: newCourse.scheduled_at, status: "Planungsphase"
    }]).select().single();

    if (!error && data) {
      setCourses([...courses, data]);
      setIsAddCourseOpen(false);
      setNewCourse({ title: "", instructor: "", description: "", qualification_code: "AGT", max_participants: 10, internal_notes: "", min_rank: "Feuerwehranwärter/-in", scheduled_at: "", actual_at: "" });
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Möchtest du diesen Lehrgang wirklich löschen/archivieren?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (!error) {
      setCourses(courses.filter(c => c.id !== courseId));
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
    } else {
      alert("Fehler beim Löschen: " + error.message);
    }
  };

  const handleUpdateCourseStatus = async (courseId: number, status: Course["status"]) => {
    const { error } = await supabase.from("courses").update({ status }).eq("id", courseId);
    if (!error) {
      setCourses(courses.map(c => c.id === courseId ? { ...c, status } : c));
      if (selectedCourse) setSelectedCourse({ ...selectedCourse, status });
    }
  };

  const handleUpdateActualTime = async (courseId: number, actualTime: string) => {
    const { error } = await supabase.from("courses").update({ actual_at: actualTime }).eq("id", courseId);
    if (!error) {
      setCourses(courses.map(c => c.id === courseId ? { ...c, actual_at: actualTime } : c));
      if (selectedCourse) setSelectedCourse({ ...selectedCourse, actual_at: actualTime });
    }
  };

  const handleRegisterForCourse = async (course: Course) => {
    const currentMember = members.find(m => m.user_id && profiles.find(p => p.email === userEmail)?.id === m.user_id);
    if (!currentMember) {
      alert("Dein User-Account ist noch keinem Mannschaftsmitglied zugewiesen.");
      return;
    }
    const courseRegs = registrations.filter(r => r.course_id === course.id);
    const confirmedRegs = courseRegs.filter(r => !r.is_waitlist);
    const isWaitlist = confirmedRegs.length >= course.max_participants;

    const { data, error } = await supabase.from("course_registrations").insert([{
      course_id: course.id, member_id: currentMember.id, is_waitlist: isWaitlist
    }]).select("*, members(*)").single();

    if (!error && data) {
      setRegistrations([...registrations, data as any]);
      alert(isWaitlist ? "Kurs voll! Auf Warteschlange gesetzt." : "Erfolgreich angemeldet!");
    }
  };

  const handleUnregisterFromCourse = async (registrationId: number, courseId: number) => {
    const { error } = await supabase.from("course_registrations").delete().eq("id", registrationId);
    if (!error) {
      setRegistrations(registrations.filter(r => r.id !== registrationId));
    }
  };

  const handleSetPassed = async (reg: CourseRegistration, passed: boolean) => {
    const { error } = await supabase.from("course_registrations").update({ passed }).eq("id", reg.id);
    if (!error) {
      setRegistrations(registrations.map(r => r.id === reg.id ? { ...r, passed } : r));
      if (passed && reg.members) {
        const course = courses.find(c => c.id === reg.course_id);
        const qualToAdd = qualificationsPool.find(q => q.code === course?.qualification_code);
        if (qualToAdd && !reg.members.qualifications.some(q => q.code === qualToAdd.code)) {
          const newQuals = [...reg.members.qualifications, qualToAdd];
          await supabase.from("members").update({ qualifications: newQuals }).eq("id", reg.member_id);
          setMembers(members.map(m => m.id === reg.member_id ? { ...m, qualifications: newQuals } : m));
        }
      }
    }
  };

  // Canvas Bild-Generator für Zertifikat / Urkunde (Mit neutralem "Feuerwehr • Leitstelle" Header)
  const handleDownloadCertificateImage = (reg: CourseRegistration, course: Course) => {
    const memberName = reg.members?.name || "Teilnehmer/-in";
    const isPassed = reg.passed === true;

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, 1200, 800);

    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, 1120, 720);

    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 1090, 690);

    // Header ohne "Freiwillige"
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FEUERWEHR • LEITSTELLE", 600, 130);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(isPassed ? "OFFIZIELLLES ZERTIFIKAT" : "TEILNAHMEURKUNDE", 600, 200);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "20px sans-serif";
    ctx.fillText("Hiermit wird offiziell bescheinigt, dass", 600, 270);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(memberName, 600, 345);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "20px sans-serif";
    ctx.fillText("erfolgreich an folgendem Lehrgang teilgenommen hat:", 600, 420);

    ctx.fillStyle = "#f87171";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(course.title, 600, 470);

    if (isPassed) {
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(`ERFOLGREICH BESTANDEN — Erworbene Qualifikation: [ ${course.qualification_code} ]`, 600, 540);
    } else {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "20px sans-serif";
      ctx.fillText(`Teilnahme ohne Qualifikationserwerb`, 600, 540);
    }

    ctx.fillStyle = "#71717a";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Ausbilder: ${course.instructor}`, 100, 670);
    ctx.fillText(`Datum: ${new Date(course.actual_at || course.scheduled_at).toLocaleDateString("de-DE")}`, 100, 700);

    ctx.textAlign = "right";
    ctx.fillText("___________________________________", 1100, 670);
    ctx.fillText("Lehrgangsleitung & Dienststempel", 1100, 700);

    const link = document.createElement("a");
    link.download = `${isPassed ? "Zertifikat" : "Urkunde"}_${memberName.replace(/\s+/g, "_")}_${course.qualification_code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleAddFeedback = async (regId: number) => {
    const noteText = newFeedbackNote[regId];
    if (!noteText) return;
    const { data, error } = await supabase.from("course_feedback").insert([{
      registration_id: regId, author: userEmail, note: noteText
    }]).select().single();
    if (!error && data) {
      setFeedbacks([...feedbacks, data]);
      setNewFeedbackNote({ ...newFeedbackNote, [regId]: "" });
    }
  };

  // Übungen (inkl. Löschen)
  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from("exercises").insert([{
      title: newExercise.title, instructor: newExercise.instructor, description: newExercise.description,
      max_participants: newExercise.max_participants, min_rank: newExercise.min_rank,
      scheduled_at: newExercise.scheduled_at, actual_at: newExercise.scheduled_at, status: "Planungsphase"
    }]).select().single();

    if (!error && data) {
      setExercises([...exercises, data]);
      setIsAddExerciseOpen(false);
      setNewExercise({ title: "", instructor: "", description: "", max_participants: 20, min_rank: "Feuerwehranwärter/-in", scheduled_at: "", actual_at: "" });
    }
  };

  const handleDeleteExercise = async (exerciseId: number) => {
    if (!confirm("Möchtest du diese Übung wirklich löschen/archivieren?")) return;
    const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
    if (!error) {
      setExercises(exercises.filter(ex => ex.id !== exerciseId));
      if (selectedExercise?.id === exerciseId) setSelectedExercise(null);
    } else {
      alert("Fehler beim Löschen: " + error.message);
    }
  };

  const handleUpdateExerciseStatus = async (exerciseId: number, status: Exercise["status"]) => {
    const { error } = await supabase.from("exercises").update({ status }).eq("id", exerciseId);
    if (!error) {
      setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, status } : ex));
      if (selectedExercise) setSelectedExercise({ ...selectedExercise, status });
    }
  };

  const handleRegisterForExercise = async (exercise: Exercise) => {
    const currentMember = members.find(m => m.user_id && profiles.find(p => p.email === userEmail)?.id === m.user_id);
    if (!currentMember) {
      alert("Dein User-Account ist noch keinem Mannschaftsmitglied zugewiesen.");
      return;
    }
    const exRegs = exerciseRegistrations.filter(r => r.exercise_id === exercise.id);
    const confirmedRegs = exRegs.filter(r => !r.is_waitlist);
    const isWaitlist = confirmedRegs.length >= exercise.max_participants;

    const { data, error } = await supabase.from("exercise_registrations").insert([{
      exercise_id: exercise.id, member_id: currentMember.id, is_waitlist: isWaitlist, attended: false
    }]).select("*, members(*)").single();

    if (!error && data) {
      setExerciseRegistrations([...exerciseRegistrations, data as any]);
      alert(isWaitlist ? "Übung voll! Auf Warteschlange gesetzt." : "Erfolgreich für Übung angemeldet!");
    }
  };

  const handleUnregisterFromExercise = async (regId: number) => {
    const { error } = await supabase.from("exercise_registrations").delete().eq("id", regId);
    if (!error) {
      setExerciseRegistrations(exerciseRegistrations.filter(r => r.id !== regId));
    }
  };

  const handleSetAttended = async (regId: number, attended: boolean) => {
    const { error } = await supabase.from("exercise_registrations").update({ attended }).eq("id", regId);
    if (!error) {
      setExerciseRegistrations(exerciseRegistrations.map(r => r.id === regId ? { ...r, attended } : r));
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Sitzung wird überprüft...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-zinc-900 border border-red-900/40 p-8 rounded-2xl max-w-md space-y-4 shadow-2xl">
          <div className="text-4xl">🛑</div>
          <h1 className="text-xl font-bold text-white">Zugriff eingeschränkt</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">Dein Account besitzt noch keine freigeschaltete Rolle.</p>
          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-500 font-mono">Konto: {userEmail}</div>
          <button onClick={handleLogout} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs py-2.5 rounded-lg transition-colors cursor-pointer">
            🚪 Abmelden
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "mannschaft", label: "Mannschaft", icon: "👥", roles: ["mitglied", "maschinist", "lehrgangsmeister", "disponent", "admin"] },
    { id: "benutzer", label: "Benutzerverwaltung", icon: "🔐", roles: ["admin"] },
    { id: "qualifikationen", label: "Qualifikationen-Pool", icon: "🎖️", roles: ["admin", "lehrgangsmeister"] },
    { id: "maschinist", label: "Maschinist & Fahrzeuge", icon: "🚒", roles: ["maschinist", "admin", "disponent"] },
    { id: "lehrgaenge", label: "Lehrgänge", icon: "📚", roles: ["mitglied", "maschinist", "lehrgangsmeister", "disponent", "admin"] },
    { id: "lehrgangsmanagement", label: "Lehrgangsmanagement", icon: "📋", roles: ["lehrgangsmeister", "admin"] },
    { id: "uebungen", label: "Übungen & Logbuch", icon: "🛡️", roles: ["mitglied", "maschinist", "lehrgangsmeister", "disponent", "admin"] },
    { id: "uebungsmanagement", label: "Übungsmanagement", icon: "📑", roles: ["lehrgangsmeister", "admin"] },
    { id: "fahrzeugsetup", label: "Fahrzeugsetup", icon: "🛠️", roles: ["admin"] },
    { id: "leitstelle", label: "Leitstelle & Protokoll", icon: "📡", roles: ["mitglied", "maschinist", "lehrgangsmeister", "disponent", "admin"] },
    { id: "einstellungen", label: "Einstellungen", icon: "⚙️", roles: ["mitglied", "maschinist", "lehrgangsmeister", "disponent", "admin"] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole));
  const activeOperationsCount = operations.filter(op => op.status === "Aktiv").length;

  const getFmsBadge = (status: number) => {
    switch (status) {
      case 1: return <span className="bg-blue-950 text-blue-400 border-blue-800 px-2.5 py-1 rounded-full text-xs border font-medium">1 - Frei Funk</span>;
      case 2: return <span className="bg-emerald-950 text-emerald-400 border-emerald-800 px-2.5 py-1 rounded-full text-xs border font-medium">2 - Frei Wache</span>;
      case 3: return <span className="bg-amber-950 text-amber-400 border-amber-800 px-2.5 py-1 rounded-full text-xs border font-medium">3 - Anfahrt</span>;
      case 4: return <span className="bg-red-950 text-red-400 border-red-800 px-2.5 py-1 rounded-full text-xs border font-medium">4 - An Einsatzstelle</span>;
      default: return <span className="bg-zinc-800 text-zinc-400 border-zinc-700 px-2.5 py-1 rounded-full text-xs border font-medium">6 - Außer Dienst</span>;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* SEITENLEISTE */}
      <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-lg font-bold tracking-tight text-red-500 flex items-center gap-2">
              <span>🚒</span> Feuerwehr Leitstelle
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 capitalize">Rolle: <span className="text-white font-bold">{userRole}</span></p>
          </div>

          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {visibleNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSelectedCourse(null); setSelectedExercise(null); setSelectedVehicleForReport(null); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-red-600/10 text-red-400 border border-red-600/30 shadow-sm" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.id === "leitstelle" && activeOperationsCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {activeOperationsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center font-bold text-red-400 text-xs shrink-0">
              {userEmail.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate" title={userEmail}>{userEmail}</p>
              <p className="text-[10px] text-zinc-400 truncate capitalize">{userRole}</p>
            </div>
          </div>
          <button onClick={handleLogout} title="Abmelden" className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer">
            🚪
          </button>
        </div>
      </aside>

      {/* HAUPTBEREICH */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        
        {/* LIVE ALARM BANNER (PUSH) */}
        {activeOperationsCount > 0 && (
          <div className="bg-red-600 text-white px-6 py-2.5 flex items-center justify-between shadow-lg sticky top-0 z-20 animate-pulse">
            <div className="flex items-center gap-3 text-xs font-bold tracking-wider uppercase">
              <span>🚨</span>
              <span>Aktueller Einsatz läuft! ({activeOperationsCount} Alarm aktiv)</span>
            </div>
            <button onClick={() => setActiveTab("leitstelle")} className="bg-white text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-zinc-100 transition-colors">
              Zur Leitstelle ➔
            </button>
          </div>
        )}

        <header className="h-16 border-b border-zinc-800 bg-zinc-900/40 px-8 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>

          {(userRole === "disponent" || userRole === "admin") && (
            <button onClick={() => setIsAlarmModalOpen(true)} className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2 cursor-pointer">
              <span>🚨</span> Alarmierung Auslösen
            </button>
          )}
        </header>

        <div className="p-8 flex-1">
          
          {/* TAB: MANNSCHAFT */}
          {activeTab === "mannschaft" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-zinc-400 text-sm">Mannschaftsliste der Feuerwehr.</p>
                {userRole === "admin" && (
                  <button onClick={() => setIsAddMemberOpen(true)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <span>➕</span> Mitglied hinzufügen
                  </button>
                )}
              </div>

              {isAddMemberOpen && userRole === "admin" && (
                <div className="bg-zinc-900 border border-zinc-700 p-5 rounded-xl mb-6 shadow-xl max-w-lg">
                  <h3 className="text-md font-bold text-white mb-3">Neues Mitglied eintragen</h3>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Vor- und Nachname</label>
                      <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="z.B. Anna Becker" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Dienstgrad</label>
                        <select value={newRank} onChange={(e) => setNewRank(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                          {ranksList.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Funktionsabzeichen</label>
                        <select value={newFunctionBadge} onChange={(e) => setNewFunctionBadge(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                          {functionBadgesList.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Supabase User-Account verknüpfen (Optional)</label>
                      <select value={newSelectedUserId} onChange={(e) => setNewSelectedUserId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                        <option value="">Kein Account verknüpft</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.email}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsAddMemberOpen(false)} className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                      <button type="submit" className="px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white font-medium">Speichern</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-6 font-semibold">Name / Account</th>
                      <th className="py-3.5 px-6 font-semibold">Dienstgrad / Funktion</th>
                      <th className="py-3.5 px-6 font-semibold">Status</th>
                      <th className="py-3.5 px-6 font-semibold">Qualifikationen</th>
                      {userRole === "admin" && <th className="py-3.5 px-6 text-right font-semibold">Aktionen</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm">
                    {members.map((member) => {
                      const linkedProfile = profiles.find(p => p.id === member.user_id);
                      return (
                        <tr key={member.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white">{member.name}</div>
                            {linkedProfile && <div className="text-xs text-blue-400 mt-0.5">🔗 {linkedProfile.email}</div>}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 font-medium">{member.rank}</span>
                              {member.function_badge && <span className="text-[11px] bg-amber-950/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded font-medium">⭐ {member.function_badge}</span>}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${member.status === "Bereit" ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {member.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {member.qualifications.map((qual) => (
                                <span key={qual.code} className={`text-xs px-2 py-0.5 rounded border font-medium ${qual.color}`}>{qual.label}</span>
                              ))}
                            </div>
                          </td>
                          {userRole === "admin" && (
                            <td className="py-4 px-6 text-right space-x-2">
                              <button onClick={() => openEditModal(member)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded border border-zinc-700">⚙️ Bearbeiten</button>
                              <button onClick={() => setMemberToDelete(member)} className="text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/60 px-2.5 py-1.5 rounded">🗑️ Löschen</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {editingMember && userRole === "admin" && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <h3 className="text-lg font-bold text-white">Mitglied bearbeiten</h3>
                      <button onClick={() => setEditingMember(null)} className="text-zinc-400 hover:text-white">✕</button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Vor- und Nachname</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Dienstgrad</label>
                          <select value={editRank} onChange={e => setEditRank(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                            {ranksList.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Funktion</label>
                          <select value={editFuncBadge} onChange={e => setEditFuncBadge(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                            {functionBadgesList.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Supabase User-Account verknüpfen</label>
                        <select value={editUserId} onChange={e => setEditUserId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                          <option value="">Kein Account verknüpft</option>
                          {profiles.map(p => <option key={p.id} value={p.id}>{p.email}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-2 font-medium">Qualifikationen verwalten</label>
                        <div className="flex flex-wrap gap-2">
                          {qualificationsPool.map((q) => {
                            const hasIt = editingMember.qualifications.some(eq => eq.code === q.code);
                            return (
                              <button
                                key={q.code}
                                type="button"
                                onClick={() => toggleQualificationForMember(editingMember.id, q)}
                                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${hasIt ? "bg-red-600 text-white border-red-500 shadow" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                              >
                                {q.label} {hasIt ? "✓" : "+"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                      <button onClick={() => setEditingMember(null)} className="px-4 py-2 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                      <button onClick={handleSaveEditMember} className="px-4 py-2 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-bold">Änderungen speichern</button>
                    </div>
                  </div>
                </div>
              )}

              {memberToDelete && userRole === "admin" && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-zinc-900 border border-red-900/60 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
                    <h3 className="text-lg font-bold text-red-400 flex items-center gap-2"><span>⚠️</span> Mitglied löschen?</h3>
                    <p className="text-sm text-zinc-300">Möchtest du <strong className="text-white">{memberToDelete.name}</strong> wirklich entfernen?</p>
                    <div className="flex justify-end gap-3 pt-2">
                      <button onClick={() => setMemberToDelete(null)} className="px-4 py-2 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                      <button onClick={() => handleDeleteMember(memberToDelete.id)} className="px-4 py-2 rounded-lg text-xs bg-red-600 text-white font-bold">Endgültig löschen</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: BENUTZERVERWALTUNG */}
          {activeTab === "benutzer" && userRole === "admin" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Registrierte Benutzerkonten & Rollenverwaltung</h2>
                <p className="text-zinc-400 text-sm">Weise hier Rollen zu.</p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm max-w-4xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-6 font-semibold">E-Mail-Adresse</th>
                      <th className="py-3.5 px-6 font-semibold">Rolle</th>
                      <th className="py-3.5 px-6 text-right font-semibold">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm">
                    {profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-800/40">
                        <td className="py-4 px-6 font-medium text-white">{p.email}</td>
                        <td className="py-4 px-6">
                          {p.role ? <span className="text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded font-bold capitalize">{p.role}</span> : <span className="text-xs bg-red-950/80 text-red-400 border border-red-800 px-2.5 py-1 rounded font-bold">🛑 Gesperrt</span>}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <select value={p.role || "null"} onChange={(e) => handleAssignRole(p.id, e.target.value as any)} className="bg-zinc-950 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 font-medium">
                            <option value="null">🛑 Keine Rolle (Sperren)</option>
                            <option value="mitglied">🟢 Mitglied</option>
                            <option value="maschinist">🚒 Maschinist</option>
                            <option value="lehrgangsmeister">🔵 Lehrgangsmeister</option>
                            <option value="disponent">🟡 Disponent</option>
                            <option value="admin">🔴 Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: FAHRZEUGSETUP (ADMIN) */}
          {activeTab === "fahrzeugsetup" && userRole === "admin" && (
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-white">Fahrzeugtypen-Pool</h2>
                    <p className="text-zinc-400 text-sm">Lege hier Typen an.</p>
                  </div>
                </div>

                <form onSubmit={handleAddVehicleType} className="flex gap-3 max-w-md">
                  <input type="text" value={newVehicleTypeName} onChange={e => setNewVehicleTypeName(e.target.value)} placeholder="Neuer Typ (z.B. GW-L)" className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white flex-1" required />
                  <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-4 py-2 rounded-lg">Typ hinzufügen</button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {vehicleTypesPool.map(vt => (
                    <div key={vt.id} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-2">
                      <span>{vt.name}</span>
                      <button onClick={() => handleDeleteVehicleType(vt.id)} className="text-red-400 hover:text-red-300 font-bold ml-1">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-800 pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-white">Fuhrpark & Fahrzeuge</h2>
                    <p className="text-zinc-400 text-sm">Erstelle konkrete Fahrzeuge mit Funkrufname.</p>
                  </div>
                  <button onClick={() => setIsAddVehicleOpen(true)} className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                    <span>➕</span> Fahrzeug hinzufügen
                  </button>
                </div>

                {isAddVehicleOpen && (
                  <div className="bg-zinc-900 border border-zinc-700 p-5 rounded-xl max-w-md shadow-xl">
                    <h3 className="text-md font-bold text-white mb-3">Neues Fahrzeug anlegen</h3>
                    <form onSubmit={handleAddVehicle} className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Funkrufname</label>
                        <input type="text" value={newVehicleName} onChange={e => setNewVehicleName(e.target.value)} placeholder="z.B. Florian Stadt 1/44/1" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Fahrzeugtyp</label>
                          <select value={newVehicleType} onChange={e => setNewVehicleType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white">
                            {vehicleTypesPool.map(vt => <option key={vt.id} value={vt.name}>{vt.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Wache / Standort</label>
                          <input type="text" value={newVehicleWache} onChange={e => setNewVehicleWache(e.target.value)} placeholder="z.B. Wache 1" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAddVehicleOpen(false)} className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                        <button type="submit" className="px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white font-bold">Speichern</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((v) => (
                    <div key={v.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-zinc-500 font-semibold">{v.wache}</span>
                        <h3 className="font-bold text-white text-base">{v.name}</h3>
                        <p className="text-xs text-red-400 font-medium mt-0.5">{v.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getFmsBadge(v.fms_status)}
                        <button onClick={() => handleDeleteVehicle(v.id)} className="text-xs bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 px-2.5 py-1.5 rounded">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MASCHINIST & FAHRZEUGE */}
          {activeTab === "maschinist" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Maschinist & Fahrzeugstatus</h2>
                <p className="text-zinc-400 text-sm">Ändere den FMS-Status oder melde Beschädigungen & Materialverbrauch.</p>
              </div>

              {!selectedVehicleForReport ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((v) => (
                    <div key={v.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs text-zinc-500 font-semibold">{v.wache}</span>
                          <h3 className="font-bold text-white text-base">{v.name}</h3>
                          <p className="text-xs text-red-400 font-medium">{v.type}</p>
                        </div>
                        <div>{getFmsBadge(v.fms_status)}</div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-zinc-400 font-bold uppercase">FMS-Status umschalten</label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 6].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleUpdateFmsStatus(v.id, st)}
                              className={`text-xs py-1 rounded font-bold border transition-all ${v.fms_status === st ? "bg-red-600 text-white border-red-500 shadow" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800"}`}
                            >
                              St. {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-xs text-zinc-400">
                          {vehicleReports.filter(r => r.vehicle_id === v.id).length} Meldungen vorhanden
                        </span>
                        <button
                          onClick={() => setSelectedVehicleForReport(v)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg border border-zinc-700 font-medium"
                        >
                          ⚠️ Schaden / Verbrauch melden
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-xl space-y-5">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <div>
                      <button onClick={() => setSelectedVehicleForReport(null)} className="text-xs text-zinc-400 hover:text-white mb-1">← Zurück zur Übersicht</button>
                      <h3 className="text-lg font-bold text-white">Meldung für {selectedVehicleForReport.name}</h3>
                    </div>
                  </div>

                  <form onSubmit={handleCreateReport} className="space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Art der Meldung</label>
                      <select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white font-medium">
                        <option value="beschädigung">⚠️ Beschädigung / Defekt</option>
                        <option value="verbrauch">📦 Materialverbrauch / Nachbestellung</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Beschreibung / Details</label>
                      <textarea
                        rows={4}
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Details..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setSelectedVehicleForReport(null)} className="px-4 py-2 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                      <button type="submit" className="px-4 py-2 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-bold">Meldung abschicken</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-3 pt-4">
                <h3 className="text-md font-bold text-white">Historie aller Fahrzeugmeldungen</h3>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
                        <th className="py-3.5 px-6">Fahrzeug</th>
                        <th className="py-3.5 px-6">Art</th>
                        <th className="py-3.5 px-6">Beschreibung</th>
                        <th className="py-3.5 px-6">Melder</th>
                        <th className="py-3.5 px-6">Datum</th>
                        {userRole === "admin" && <th className="py-3.5 px-6 text-right">Aktion</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {vehicleReports.map(rep => {
                        const veh = vehicles.find(v => v.id === rep.vehicle_id);
                        return (
                          <tr key={rep.id} className="hover:bg-zinc-800/40">
                            <td className="py-3 px-6 font-medium text-white">{veh?.name || "Unbekannt"}</td>
                            <td className="py-3 px-6">
                              <span className={`text-xs px-2 py-0.5 rounded font-bold ${rep.report_type === "beschädigung" ? "bg-red-950 text-red-400 border border-red-800" : "bg-blue-950 text-blue-400 border border-blue-800"}`}>
                                {rep.report_type === "beschädigung" ? "⚠️ Beschädigung" : "📦 Verbrauch"}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-zinc-300">{rep.description}</td>
                            <td className="py-3 px-6 text-xs text-zinc-400">{rep.reporter}</td>
                            <td className="py-3 px-6 text-xs text-zinc-500">{new Date(rep.created_at).toLocaleString("de-DE")}</td>
                            {userRole === "admin" && (
                              <td className="py-3 px-6 text-right">
                                <button onClick={() => handleDeleteReport(rep.id)} className="text-xs bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 px-2.5 py-1 rounded">🗑️ Löschen</button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: QUALIFIKATIONEN-POOL */}
          {activeTab === "qualifikationen" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Qualifikationen-Pool</h2>
                <p className="text-zinc-400 text-sm">Erstelle oder lösche Qualifikationen.</p>
              </div>

              {userRole === "admin" && (
                <div className="bg-zinc-900 border border-zinc-700 p-5 rounded-xl max-w-lg shadow-xl">
                  <h3 className="text-md font-bold text-white mb-3">Neue Qualifikation anlegen</h3>
                  <form onSubmit={handleCreateQualification} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Kürzel (Code)</label>
                        <input type="text" value={newQualCode} onChange={e => setNewQualCode(e.target.value)} placeholder="z.B. CSA" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white uppercase" required />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Bezeichnung</label>
                        <input type="text" value={newQualLabel} onChange={e => setNewQualLabel(e.target.value)} placeholder="z.B. Chemikalienschutzanzug" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Badge-Design / Farbe</label>
                      <select value={newQualColor} onChange={e => setNewQualColor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white">
                        {colorOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 rounded-lg">Qualifikation erstellen</button>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {qualificationsPool.map(q => (
                  <div key={q.code} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-zinc-500 font-mono">Code: {q.code}</div>
                      <div className="font-bold text-white text-base mt-1">{q.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded border font-medium ${q.color}`}>{q.code}</span>
                      {userRole === "admin" && (
                        <button onClick={() => handleDeleteQualification(q.code)} className="text-xs bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 px-2 py-1 rounded">🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: LEHRGÄNGE */}
          {activeTab === "lehrgaenge" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Verfügbare Lehrgänge</h2>
                <p className="text-zinc-400 text-sm">Melde dich für geplante Lehrgänge an.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => {
                  const courseRegs = registrations.filter(r => r.course_id === course.id);
                  const confirmedRegs = courseRegs.filter(r => !r.is_waitlist);
                  const waitlistRegs = courseRegs.filter(r => r.is_waitlist);

                  const currentMember = members.find(m => m.user_id && profiles.find(p => p.email === userEmail)?.id === m.user_id);
                  const myReg = courseRegs.find(r => r.member_id === currentMember?.id);

                  return (
                    <div key={course.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs bg-red-950/60 text-red-400 border border-red-800 px-2 py-0.5 rounded font-medium">Qualifikation: {course.qualification_code}</span>
                          <span className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded-full font-medium">{course.status}</span>
                        </div>
                        <h3 className="font-bold text-white text-base mt-2">{course.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{course.description}</p>
                        
                        <div className="mt-4 space-y-1 text-xs text-zinc-400">
                          <div>👨‍🏫 Ausbilder: <span className="text-zinc-200">{course.instructor}</span></div>
                          <div>📅 Geplant: <span className="text-zinc-200">{new Date(course.scheduled_at).toLocaleString("de-DE")}</span></div>
                          {course.actual_at && course.actual_at !== course.scheduled_at && (
                            <div className="text-amber-400">⏱️ Tatsächlich: {new Date(course.actual_at).toLocaleString("de-DE")}</div>
                          )}
                          <div>👥 Plätze: <span className="text-zinc-200">{confirmedRegs.length} / {course.max_participants}</span> {waitlistRegs.length > 0 && <span className="text-amber-400">({waitlistRegs.length} auf Warteschlange)</span>}</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                        {myReg ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded font-medium ${myReg.is_waitlist ? "bg-amber-950 text-amber-400 border border-amber-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"}`}>
                              {myReg.is_waitlist ? "⏳ Auf Warteschlange" : "✅ Angemeldet"}
                            </span>
                            <button onClick={() => handleUnregisterFromCourse(myReg.id, course.id)} className="text-xs text-red-400 hover:underline">Abmelden</button>
                          </div>
                        ) : (
                          <button onClick={() => handleRegisterForCourse(course)} disabled={course.status === "Anmeldungen Geschlossen" || course.status === "Abgeschlossen"} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-xs py-2 rounded-lg shadow">
                            {confirmedRegs.length >= course.max_participants ? "Auf Warteschlange setzen" : "Jetzt Anmelden"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: LEHRGANGSMANAGEMENT */}
          {activeTab === "lehrgangsmanagement" && (userRole === "lehrgangsmeister" || userRole === "admin") && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Lehrgangsmanagement & Auswertung</h2>
                  <p className="text-zinc-400 text-sm">Verwalte Kurse, Teilnehmer, Zertifikate als PNG und Archivierung.</p>
                </div>
                <button onClick={() => setIsAddCourseOpen(true)} className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                  <span>➕</span> Neuen Lehrgang anlegen
                </button>
              </div>

              {isAddCourseOpen && (
                <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl max-w-2xl">
                  <h3 className="text-md font-bold text-white mb-4">Lehrgang ausschreiben</h3>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Lehrgangsname</label>
                        <input type="text" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder="z.B. Maschinist 2026" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Ausbilder</label>
                        <input type="text" value={newCourse.instructor} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} placeholder="z.B. OBM Meyer" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Kurzbeschreibung</label>
                      <textarea rows={2} value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Qualifikation</label>
                        <select value={newCourse.qualification_code} onChange={e => setNewCourse({...newCourse, qualification_code: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white">
                          {qualificationsPool.map(q => <option key={q.code} value={q.code}>{q.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Max. Teilnehmer</label>
                        <input type="number" min={1} value={newCourse.max_participants} onChange={e => setNewCourse({...newCourse, max_participants: parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Min. Rang</label>
                        <select value={newCourse.min_rank} onChange={e => setNewCourse({...newCourse, min_rank: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white">
                          {ranksList.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Geplantes Datum & Uhrzeit</label>
                      <input type="datetime-local" value={newCourse.scheduled_at} onChange={e => setNewCourse({...newCourse, scheduled_at: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                    </div>
                    <div className="flex justify-end gap-2 pt-3">
                      <button type="button" onClick={() => setIsAddCourseOpen(false)} className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                      <button type="submit" className="px-4 py-1.5 rounded-lg text-xs bg-red-600 text-white font-bold">Veröffentlichen</button>
                    </div>
                  </form>
                </div>
              )}

              {!selectedCourse ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => {
                    const courseRegs = registrations.filter(r => r.course_id === course.id);
                    return (
                      <div key={course.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                        <div onClick={() => setSelectedCourse(course)} className="cursor-pointer space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-xs bg-red-950/60 text-red-400 border border-red-800 px-2 py-0.5 rounded font-medium">{course.qualification_code}</span>
                            <span className="text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded-full font-medium">{course.status}</span>
                          </div>
                          <h3 className="font-bold text-white text-base">{course.title}</h3>
                          <p className="text-xs text-zinc-400">Anmeldungen: <strong className="text-white">{courseRegs.filter(r=>!r.is_waitlist).length} / {course.max_participants}</strong></p>
                          <div className="text-xs text-red-400 font-medium">➔ Details & Teilnehmer verwalten</div>
                        </div>
                        <div className="pt-2 border-t border-zinc-800 flex justify-end">
                          <button onClick={() => handleDeleteCourse(course.id)} className="text-xs bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-1.5 rounded">🗑️ Lehrgang löschen / archivieren</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <div>
                      <button onClick={() => setSelectedCourse(null)} className="text-xs text-zinc-400 hover:text-white mb-2">← Zurück zur Übersicht</button>
                      <h2 className="text-xl font-bold text-white">{selectedCourse.title}</h2>
                      <p className="text-xs text-zinc-400">Ausbilder: {selectedCourse.instructor}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-0.5">Live-Status</label>
                        <select value={selectedCourse.status} onChange={(e) => handleUpdateCourseStatus(selectedCourse.id, e.target.value as any)} className="bg-zinc-950 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 font-medium">
                          <option value="Planungsphase">🟡 Planungsphase</option>
                          <option value="Bestätigt">🟢 Bestätigt</option>
                          <option value="Anmeldungen Geschlossen">🔒 Geschlossen</option>
                          <option value="Läuft">🚨 Läuft</option>
                          <option value="Abgeschlossen">🏁 Abgeschlossen</option>
                        </select>
                      </div>
                      <button onClick={() => handleDeleteCourse(selectedCourse.id)} className="text-xs bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-2 rounded mt-4">🗑️ Löschen</button>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Zeitmanagement & Verspätungen</h4>
                      <p className="text-[11px] text-zinc-400">Geplant: {new Date(selectedCourse.scheduled_at).toLocaleString("de-DE")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Tatsächlicher Termin:</span>
                      <input
                        type="datetime-local"
                        defaultValue={selectedCourse.actual_at ? new Date(selectedCourse.actual_at).toISOString().slice(0, 16) : ""}
                        onChange={(e) => handleUpdateActualTime(selectedCourse.id, e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-md font-bold text-white">Teilnehmer-Liste, Bewertung & Zertifikats-Bild (PNG)</h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Ergebnis & Urkunden-Bild (PNG)</th>
                            <th className="py-3 px-4">Notizen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {registrations.filter(r => r.course_id === selectedCourse.id).map((reg) => {
                            const regFeedbacks = feedbacks.filter(f => f.registration_id === reg.id);
                            return (
                              <tr key={reg.id} className="hover:bg-zinc-900/50">
                                <td className="py-4 px-4 font-medium text-white">{reg.members?.name || "Unbekannt"}</td>
                                <td className="py-4 px-4">
                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${reg.is_waitlist ? "bg-amber-950 text-amber-400 border border-amber-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"}`}>
                                    {reg.is_waitlist ? "⏳ Warteschlange" : "✅ Bestätigt"}
                                  </span>
                                </td>
                                <td className="py-4 px-4 space-y-2">
                                  <div className="flex gap-2">
                                    <button onClick={() => handleSetPassed(reg, true)} className={`text-xs px-2.5 py-1 rounded font-bold ${reg.passed === true ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>Bestanden ✓</button>
                                    <button onClick={() => handleSetPassed(reg, false)} className={`text-xs px-2.5 py-1 rounded font-bold ${reg.passed === false ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>Durchgefallen ✕</button>
                                  </div>
                                  {reg.passed !== null && (
                                    <button
                                      onClick={() => handleDownloadCertificateImage(reg, selectedCourse)}
                                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer"
                                    >
                                      <span>🖼️</span> {reg.passed ? "Zertifikat als Bild (PNG) laden" : "Teilnahmeurkunde als Bild laden"}
                                    </button>
                                  )}
                                </td>
                                <td className="py-4 px-4 space-y-2">
                                  <div className="space-y-1">
                                    {regFeedbacks.map(f => (
                                      <div key={f.id} className="text-xs bg-zinc-900 border border-zinc-800 p-2 rounded text-zinc-300">
                                        <span className="text-zinc-500 font-bold">{f.author}:</span> {f.note}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <input type="text" placeholder="z.B. Gute Mitarbeit..." value={newFeedbackNote[reg.id] || ""} onChange={(e) => setNewFeedbackNote({ ...newFeedbackNote, [reg.id]: e.target.value })} className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded p-1.5 flex-1" />
                                    <button onClick={() => handleAddFeedback(reg.id)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-2.5 py-1.5 rounded">Eintragen</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: ÜBUNGEN & LOGBUCH */}
          {activeTab === "uebungen" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Übungen & persönliches Logbuch</h2>
                <p className="text-zinc-400 text-sm">Übersicht aller Übungen, Anmeldungen und deiner Anwesenheits-Statistik.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercises.map((exercise) => {
                  const exRegs = exerciseRegistrations.filter(r => r.exercise_id === exercise.id);
                  const confirmedRegs = exRegs.filter(r => !r.is_waitlist);
                  const currentMember = members.find(m => m.user_id && profiles.find(p => p.email === userEmail)?.id === m.user_id);
                  const myReg = exRegs.find(r => r.member_id === currentMember?.id);

                  return (
                    <div key={exercise.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs bg-blue-950 text-blue-400 border border-blue-800 px-2.5 py-0.5 rounded font-medium">Übung</span>
                          <span className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded-full font-medium">{exercise.status}</span>
                        </div>
                        <h3 className="font-bold text-white text-base mt-2">{exercise.title}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{exercise.description}</p>
                        
                        <div className="mt-4 space-y-1 text-xs text-zinc-400">
                          <div>👨‍🏫 Übungsleiter: <span className="text-zinc-200">{exercise.instructor}</span></div>
                          <div>📅 Geplant: <span className="text-zinc-200">{new Date(exercise.scheduled_at).toLocaleString("de-DE")}</span></div>
                          <div>👥 Angemeldet: <span className="text-zinc-200">{confirmedRegs.length} / {exercise.max_participants}</span></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                        {myReg ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded font-medium ${myReg.attended ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-emerald-950/60 text-emerald-300 border border-emerald-800"}`}>
                              {myReg.attended ? "✅ Anwesend bestätigt" : "✅ Angemeldet"}
                            </span>
                            <button onClick={() => handleUnregisterFromExercise(myReg.id)} className="text-xs text-red-400 hover:underline">Abmelden</button>
                          </div>
                        ) : (
                          <button onClick={() => handleRegisterForExercise(exercise)} disabled={exercise.status === "Abgeschlossen"} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-xs py-2 rounded-lg shadow">
                            Für Übung anmelden
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: ÜBUNGSMANAGEMENT */}
          {activeTab === "uebungsmanagement" && (userRole === "lehrgangsmeister" || userRole === "admin") && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Übungsmanagement & Anwesenheits-Logbuch</h2>
                  <p className="text-zinc-400 text-sm">Erstelle Übungen, erfasse Anwesenheit und verwalte Archivierung.</p>
                </div>
                <button onClick={() => setIsAddExerciseOpen(true)} className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center gap-2">
                  <span>➕</span> Neue Übung anlegen
                </button>
              </div>

              {isAddExerciseOpen && (
                <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl max-w-2xl">
                  <h3 className="text-md font-bold text-white mb-4">Übung planen</h3>
                  <form onSubmit={handleCreateExercise} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Übungstitel</label>
                        <input type="text" value={newExercise.title} onChange={e => setNewExercise({...newExercise, title: e.target.value})} placeholder="z.B. Zugübung Brandbekämpfung" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Übungsleiter</label>
                        <input type="text" value={newExercise.instructor} onChange={e => setNewExercise({...newExercise, instructor: e.target.value})} placeholder="z.B. BI Müller" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Beschreibung</label>
                      <textarea rows={2} value={newExercise.description} onChange={e => setNewExercise({...newExercise, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Max. Teilnehmer</label>
                        <input type="number" min={1} value={newExercise.max_participants} onChange={e => setNewExercise({...newExercise, max_participants: parseInt(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Geplantes Datum & Uhrzeit</label>
                        <input type="datetime-local" value={newExercise.scheduled_at} onChange={e => setNewExercise({...newExercise, scheduled_at: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white" required />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-3">
                      <button type="button" onClick={() => setIsAddExerciseOpen(false)} className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                      <button type="submit" className="px-4 py-1.5 rounded-lg text-xs bg-red-600 text-white font-bold">Übung veröffentlichen</button>
                    </div>
                  </form>
                </div>
              )}

              {!selectedExercise ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercises.map((exercise) => {
                    const exRegs = exerciseRegistrations.filter(r => r.exercise_id === exercise.id);
                    return (
                      <div key={exercise.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                        <div onClick={() => setSelectedExercise(exercise)} className="cursor-pointer space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-xs bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-medium">Übung</span>
                            <span className="text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded-full font-medium">{exercise.status}</span>
                          </div>
                          <h3 className="font-bold text-white text-base">{exercise.title}</h3>
                          <p className="text-xs text-zinc-400">Anmeldungen: <strong className="text-white">{exRegs.filter(r=>!r.is_waitlist).length} / {exercise.max_participants}</strong></p>
                          <div className="text-xs text-red-400 font-medium">➔ Anwesenheit & Logbuch verwalten</div>
                        </div>
                        <div className="pt-2 border-t border-zinc-800 flex justify-end">
                          <button onClick={() => handleDeleteExercise(exercise.id)} className="text-xs bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-1.5 rounded">🗑️ Übung löschen / archivieren</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <div>
                      <button onClick={() => setSelectedExercise(null)} className="text-xs text-zinc-400 hover:text-white mb-2">← Zurück zur Übersicht</button>
                      <h2 className="text-xl font-bold text-white">{selectedExercise.title}</h2>
                      <p className="text-xs text-zinc-400">Übungsleiter: {selectedExercise.instructor}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select value={selectedExercise.status} onChange={(e) => handleUpdateExerciseStatus(selectedExercise.id, e.target.value as any)} className="bg-zinc-950 border border-zinc-700 text-xs text-white rounded-lg px-2.5 py-1.5 font-medium">
                        <option value="Planungsphase">🟡 Planungsphase</option>
                        <option value="Bestätigt">🟢 Bestätigt</option>
                        <option value="Läuft">🚨 Läuft</option>
                        <option value="Abgeschlossen">🏁 Abgeschlossen</option>
                      </select>
                      <button onClick={() => handleDeleteExercise(selectedExercise.id)} className="text-xs bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800 px-3 py-1.5 rounded">🗑️ Löschen</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-md font-bold text-white">Anwesenheits-Logbuch (Wer war da?)</h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Anmeldung</th>
                            <th className="py-3 px-4">Anwesenheit bestätigen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {exerciseRegistrations.filter(r => r.exercise_id === selectedExercise.id).map((reg) => (
                            <tr key={reg.id} className="hover:bg-zinc-900/50">
                              <td className="py-4 px-4 font-medium text-white">{reg.members?.name || "Unbekannt"}</td>
                              <td className="py-4 px-4">
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${reg.is_waitlist ? "bg-amber-950 text-amber-400 border border-amber-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"}`}>
                                  {reg.is_waitlist ? "⏳ Warteschlange" : "✅ Angemeldet"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <button
                                  onClick={() => handleSetAttended(reg.id, !reg.attended)}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${reg.attended ? "bg-emerald-600 text-white border-emerald-500" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                                >
                                  {reg.attended ? "Anwesend ✓" : "Als anwesend eintragen +"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: LEITSTELLE & EINSATZPROTOKOLL */}
          {activeTab === "leitstelle" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Leitstelle & Einsatzprotokoll</h2>
                  <p className="text-zinc-400 text-sm">Aktive Alarme und abgeschlossene Einsätze mit Selbsteintragung.</p>
                </div>
                {(userRole === "disponent" || userRole === "admin") && (
                  <button onClick={() => setIsAlarmModalOpen(true)} className="bg-red-600 hover:bg-red-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2">
                    <span>🚨</span> Neuen Einsatz alarmieren
                  </button>
                )}
              </div>

              {/* Aktive Einsätze */}
              <div className="space-y-4">
                <h3 className="text-md font-bold text-white">Aktive Einsätze</h3>
                <div className="grid grid-cols-1 gap-4">
                  {operations.filter(op => op.status === "Aktiv").length === 0 ? (
                    <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-xl text-center text-zinc-400 text-sm">
                      Keine aktiven Einsätze. Alles ruhig.
                    </div>
                  ) : (
                    operations.filter(op => op.status === "Aktiv").map(op => (
                      <div key={op.id} className="bg-red-950/20 border border-red-900/50 rounded-xl p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="bg-red-600 text-white text-xs px-2.5 py-1 rounded font-bold animate-pulse">🚨 AKTIV</span>
                            <span className="text-xs bg-zinc-900 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded font-medium">{op.alarm_level}</span>
                            <span className="text-xs bg-zinc-900 text-red-400 border border-zinc-700 px-2.5 py-1 rounded font-bold">{op.keyword}</span>
                          </div>
                          {(userRole === "disponent" || userRole === "admin") && (
                            <button onClick={() => handleCloseOperation(op.id)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded border border-zinc-700">
                              Einsatz beenden ✓
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-zinc-300 pt-1">
                          <div>📍 <strong>Adresse:</strong> {op.address}</div>
                          <div>🚨 <strong>SoSI:</strong> {op.sosi ? "Ja" : "Nein"}</div>
                          <div>📞 <strong>Meldender:</strong> {op.caller}</div>
                        </div>

                        {op.description && (
                          <div className="text-xs bg-zinc-900/80 border border-zinc-800 p-2.5 rounded text-zinc-300">
                            📝 <strong>Beschreibung:</strong> {op.description}
                          </div>
                        )}

                        <div>
                          <div className="text-[11px] text-zinc-400 mb-1 font-bold">Ausrückende Fahrzeuge:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {op.vehicles.map((vName, idx) => (
                              <span key={idx} className="text-xs bg-red-950/80 text-red-300 border border-red-800 px-2.5 py-1 rounded font-medium">
                                🚒 {vName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Einsatzprotokoll / Abgeschlossene Einsätze mit Selbsteintrag */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-md font-bold text-white">Einsatzprotokoll & Anwesenheit</h3>
                <div className="space-y-4">
                  {operations.filter(op => op.status === "Abgeschlossen").length === 0 ? (
                    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl text-center text-zinc-400 text-xs">
                      Bisher keine abgeschlossenen Einsätze im Protokoll.
                    </div>
                  ) : (
                    operations.filter(op => op.status === "Abgeschlossen").map(op => {
                      const participants = operationParticipants.filter(p => p.operation_id === op.id);
                      return (
                        <div key={op.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded font-medium">🏁 Abgeschlossen</span>
                              <span className="text-xs text-white font-bold">{op.keyword}</span>
                              <span className="text-xs text-zinc-400">({op.address})</span>
                            </div>
                            <button
                              onClick={() => handleJoinOperation(op.id)}
                              className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow"
                            >
                              🙋 Ich war dabei! (Eintragen)
                            </button>
                          </div>

                          <div className="text-xs text-zinc-400">
                            <strong>Beteiligte Einsatzkräfte ({participants.length}):</strong>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {participants.length === 0 ? (
                                <span className="text-zinc-500 italic">Noch keine Einsatzkräfte eingetragen.</span>
                              ) : (
                                participants.map(part => (
                                  <span key={part.id} className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-1 rounded flex items-center gap-2">
                                    👨‍🚒 {part.members?.name || "Unbekannt"}
                                    {(userRole === "admin" || userRole === "disponent") && (
                                      <button onClick={() => handleRemoveOperationParticipant(part.id)} className="text-red-400 hover:text-red-300 font-bold">×</button>
                                    )}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Fahrzeug-Status Übersicht */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-md font-bold text-white">Fahrzeug-Status Übersicht</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((v) => (
                    <div key={v.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-zinc-500 font-semibold">{v.wache}</span>
                        <h3 className="font-bold text-white text-base">{v.name}</h3>
                        <p className="text-xs text-red-400 font-medium mt-0.5">{v.type}</p>
                      </div>
                      <div>{getFmsBadge(v.fms_status)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "management" && <div className="text-zinc-400 text-sm bg-zinc-900/40 p-8 rounded-xl text-center">Admin-Bereich.</div>}
          {activeTab === "einstellungen" && <div className="text-zinc-400 text-sm bg-zinc-900/40 p-8 rounded-xl text-center">Einstellungen.</div>}
        </div>
      </main>

      {/* ALARMIERUNGS-MODAL */}
      {isAlarmModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-red-500 flex items-center gap-2"><span>🚨</span> Leitstellen-Alarm auslösen</h3>
              <button onClick={() => setIsAlarmModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleTriggerAlarm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-medium">Einsatzstichwort</label>
                  <select
                    value={alarmKeyword}
                    onChange={(e) => setAlarmKeyword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white font-medium"
                    required
                  >
                    {dispatchKeywords.map(dk => (
                      <option key={dk.id} value={`${dk.code}: ${dk.title}`}>{dk.code}: {dk.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-medium">Alarmstufe</label>
                  <select
                    value={alarmLevel}
                    onChange={(e) => setAlarmLevel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white font-medium"
                  >
                    <option value="Alarmstufe 1">Alarmstufe 1 (Ortswehr)</option>
                    <option value="Alarmstufe 2">Alarmstufe 2 (Zugalarm)</option>
                    <option value="Alarmstufe 3">Alarmstufe 3 (Großalarm)</option>
                    <option value="Sondereinsatz">Sondereinsatz / Gefahrgut</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Einsatzadresse / Objekt</label>
                <input
                  type="text"
                  value={alarmAddress}
                  onChange={(e) => setAlarmAddress(e.target.value)}
                  placeholder="z.B. Hauptstraße 12, Musterstadt"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Ausrückende Fahrzeuge (Alarmdepesche)</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-950 border border-zinc-800 p-3 rounded-xl max-h-40 overflow-y-auto">
                  {vehicles.map(v => {
                    const isSelected = alarmSelectedVehicles.includes(v.name);
                    return (
                      <label key={v.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-xs transition-colors ${isSelected ? "bg-red-600/20 border-red-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300"}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlarmSelectedVehicles([...alarmSelectedVehicles, v.name]);
                            } else {
                              setAlarmSelectedVehicles(alarmSelectedVehicles.filter(name => name !== v.name));
                            }
                          }}
                          className="accent-red-600"
                        />
                        <span className="font-bold truncate">{v.name}</span> <span className="text-[10px] text-zinc-400">({v.type})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-medium">Sondersignal (SoSI)</label>
                  <select
                    value={alarmSosi ? "true" : "false"}
                    onChange={(e) => setAlarmSosi(e.target.value === "true")}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white font-medium"
                  >
                    <option value="true">Ja (Mit Blaulicht & Horn)</option>
                    <option value="false">Nein</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-medium">Meldender</label>
                  <input
                    type="text"
                    value={alarmCaller}
                    onChange={(e) => setAlarmCaller(e.target.value)}
                    placeholder="z.B. Polizei"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Optionale Beschreibung / Lage auf Sicht</label>
                <textarea
                  rows={3}
                  value={alarmDescription}
                  onChange={(e) => setAlarmDescription(e.target.value)}
                  placeholder="Details..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAlarmModalOpen(false)} className="px-4 py-2 rounded-lg text-xs bg-zinc-800 text-zinc-300">Abbrechen</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/50">
                  🚨 Alarm auslösen & Einheiten alarmieren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}