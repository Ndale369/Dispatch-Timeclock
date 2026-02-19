import { useState, useEffect } from "react";

const ADMIN_CODE = "******";

// helpers
const formatLocalDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const options = {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  };
  return d.toLocaleString(undefined, options).replace(",", "");
};

const parseLocalDateTime = (str) => {
  if (!str || typeof str !== "string") return null;
  const parts = str.trim().split(" ");
  if (parts.length !== 3) return null;
  const [datePart, timePart, ampm] = parts;
  const [month, day, year] = datePart.split("/").map((n) => parseInt(n, 10));
  const [hourStr, minuteStr] = timePart.split(":");
  if (!month || !day || !year || !hourStr || !minuteStr) return null;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return null;
  const upperAmpm = ampm.toUpperCase();
  if (upperAmpm === "PM" && hour !== 12) hour += 12;
  if (upperAmpm === "AM" && hour === 12) hour = 0;
  const d = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (isNaN(d.getTime())) return null;
  return d;
};

const startOfCurrentWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

const formatHoursMinutes = (minutes) => {
  if (!minutes || minutes <= 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// login screen
const LoginScreen = ({ users, onLogin }) => {
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
  const [selectedUserId, setSelectedUserId] = useState(
    sortedUsers[0]?.id || ""
  );
  const [passcodeInput, setPasscodeInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(selectedUserId, passcodeInput);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fa",
        fontFamily: "Arial"
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          minWidth: "320px"
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>
          Timeclock Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              <strong>Select User</strong>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                padding: "0.5rem"
              }}
            >
              {sortedUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>
              <strong>Passcode</strong>
            </label>
            <input
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              maxLength={6}
              style={{
                width: "100%",
                marginTop: "0.5rem",
                padding: "0.5rem"
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              marginTop: "0.5rem"
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

// EDIT PUNCHES PAGE (extracted + stable)
const EditPunchesPage = ({
  allEntries,
  users,
  getUserById,
  addPunchForUser,
  openEditPunch,
  deletePunch,
  formatLocalDateTime,
  formatHoursMinutes
}) => {
  const punchEntries = allEntries.filter((e) => e.durationMinutes);
  const grouped = {};
  punchEntries.forEach((entry) => {
    if (!entry.raw) return;
    const dateKey = new Date(entry.raw).toLocaleDateString();
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  });

  const [addPunchUserId, setAddPunchUserId] = useState("");

  return (
    <div
      style={{
        background: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        maxWidth: "900px"
      }}
    >
      <h2 style={{ marginTop: 0 }}>Edit Time Punches</h2>

      {Object.keys(grouped).length === 0 && <p>No punches yet.</p>}

      {Object.keys(grouped)
        .sort((a, b) => new Date(b) - new Date(a))
        .map((date) => {
          const dayEntries = grouped[date];
          return (
            <div
              key={date}
              style={{
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #ddd"
              }}
            >
              <h3>{date}</h3>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem"
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                      User
                    </th>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                      Clock In
                    </th>
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                      Clock Out
                    </th>
                    <th style={{ textAlign: "right", padding: "0.5rem" }}>
                      Duration
                    </th>
                    <th style={{ padding: "0.5rem" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dayEntries.map((entry, idx) => {
                    const user = getUserById(entry.userId);
                    const userEntries = user ? user.entries : [];
                    const entryIndex = userEntries.findIndex(
                      (e) =>
                        e.raw &&
                        new Date(e.raw).getTime() ===
                          new Date(entry.raw).getTime() &&
                        e.durationMinutes === entry.durationMinutes
                    );

                    return (
                      <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                        <td style={{ padding: "0.5rem" }}>
                          {entry.userName}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          {formatLocalDateTime(entry.raw)}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          {entry.durationMinutes
                            ? formatLocalDateTime(
                                new Date(
                                  new Date(entry.raw).getTime() +
                                    entry.durationMinutes * 60000
                                )
                              )
                            : ""}
                        </td>
                        <td
                          style={{
                            padding: "0.5rem",
                            textAlign: "right"
                          }}
                        >
                          {formatHoursMinutes(entry.durationMinutes)}
                        </td>
                        <td
                          style={{
                            padding: "0.5rem",
                            textAlign: "center"
                          }}
                        >
                          <button
                            onClick={() =>
                              openEditPunch(entry, entry.userId, entryIndex)
                            }
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              border: "none",
                              background: "#10b981",
                              color: "white",
                              cursor: "pointer",
                              marginRight: "0.25rem"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              deletePunch(entry.userId, entryIndex)
                            }
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              border: "none",
                              background: "#ef4444",
                              color: "white",
                              cursor: "pointer"
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: "0.5rem" }}>
                <select
                  value={addPunchUserId}
                  onChange={(e) => setAddPunchUserId(e.target.value)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    marginRight: "0.5rem"
                  }}
                >
                  <option value="">Select user...</option>
                  {users
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>

                <button
                  onClick={() => addPunchForUser(addPunchUserId)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    border: "none",
                    background: "#3b82f6",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  + Add Punch
                </button>
              </div>
            </div>
          );
        })}
    </div>
  );
};

function App() {
  // --- USERS + ADMIN ---

  const ensureAdminUser = (list) => {
    const hasAdmin = list.some((u) => u.id === "admin");
    if (hasAdmin) return list;
    return [
      ...list,
      {
        id: "admin",
        name: "Admin",
        passcode: ADMIN_CODE,
        entries: [],
        currentSessionStart: null
      }
    ];
  };

  const [users, setUsers] = useState([]);

  // --- AUTH / UI STATE ---

  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [now, setNow] = useState(new Date());
  const [currentPage, setCurrentPage] = useState("dashboard");

  // --- SETTINGS STATE ---

  const [rounding, setRounding] = useState(
    localStorage.getItem("rounding") || "1"
  );
  const [autoClockOut, setAutoClockOut] = useState(
    localStorage.getItem("autoClockOut") || "none"
  );
  const [breakReminder, setBreakReminder] = useState(
    localStorage.getItem("breakReminder") === "true"
  );

  // --- USER MODAL STATE ---

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPasscode, setNewUserPasscode] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserPasscode, setEditUserPasscode] = useState("");

  // --- PUNCH EDIT STATE ---

  const [editingPunch, setEditingPunch] = useState(null);
  const [editPunchIn, setEditPunchIn] = useState("");
  const [editPunchOut, setEditPunchOut] = useState("");
  const [editPunchDuration, setEditPunchDuration] = useState("");

  // --- CSV FILTER STATE ---

  const [csvUserFilter, setCsvUserFilter] = useState("all");

  // --- CLOCK TICK ---

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- LOAD USERS FROM KV ON STARTUP ---

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) {
          console.error("Failed to load users from /api/users");
          setUsers((prev) => ensureAdminUser(prev));
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(ensureAdminUser(data));
        } else {
          setUsers((prev) => ensureAdminUser(prev));
        }
      } catch (err) {
        console.error("Error loading users:", err);
        setUsers((prev) => ensureAdminUser(prev));
      }
    };
    loadUsers();
  }, []);

  // --- SAVE USERS TO KV WHENEVER THEY CHANGE ---

  const saveUsersToCloud = async (updatedUsers) => {
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUsers)
      });
    } catch (err) {
      console.error("Error saving users:", err);
    }
  };

  useEffect(() => {
    if (!users || users.length === 0) return;
    saveUsersToCloud(users);
  }, [users]);

  // --- DERIVED HELPERS ---

  const getUserById = (id) => users.find((u) => u.id === id) || null;

  const updateUser = (id, updater) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updater(u) } : u))
    );
  };

  const allEntries = users.flatMap((u) =>
    u.entries.map((e, index) => ({
      ...e,
      userId: u.id,
      userName: u.name,
      _index: index
    }))
  );

  const weekStart = startOfCurrentWeek();

  const totalMinutesForUser = (user) =>
    user.entries
      .filter((e) => e.durationMinutes)
      .reduce((sum, e) => sum + e.durationMinutes, 0);

  const weeklyMinutesForUser = (user) =>
    user.entries
      .filter(
        (e) =>
          e.raw && new Date(e.raw) >= weekStart && e.durationMinutes
      )
      .reduce((sum, e) => sum + e.durationMinutes, 0);

  const totalMinutesAllUsers = users.reduce(
    (sum, u) => sum + totalMinutesForUser(u),
    0
  );

  const weeklyMinutesAllUsers = users.reduce(
    (sum, u) => sum + weeklyMinutesForUser(u),
    0
  );

  // --- AUTH LOGIC ---

  const handleLogin = (selectedUserId, passcode) => {
    if (passcode === ADMIN_CODE) {
      setIsAdmin(true);
      setIsAuthenticated(true);
      setCurrentUserId(selectedUserId || "admin");
      setCurrentPage("dashboard");
      return;
    }

    const user = getUserById(selectedUserId);
    if (!user) {
      alert("User not found");
      return;
    }

    if (user.passcode === passcode) {
      setIsAdmin(false);
      setIsAuthenticated(true);
      setCurrentUserId(user.id);
      setCurrentPage("dashboard");
    } else {
      alert("Incorrect passcode");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentUserId(null);
    setCurrentPage("dashboard");
  };

  // --- USER MANAGEMENT ---

  const handleAddUser = () => {
    if (!newUserName.trim() || newUserPasscode.length !== 4) {
      alert("Enter a name and a 4-digit passcode");
      return;
    }

    const id = `${newUserName.trim().toLowerCase()}-${Date.now()}`;

    setUsers((prev) => [
      ...prev,
      {
        id,
        name: newUserName.trim(),
        passcode: newUserPasscode,
        entries: [],
        currentSessionStart: null
      }
    ]);

    setNewUserName("");
    setNewUserPasscode("");
    setShowAddUser(false);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserPasscode(user.passcode);
  };

  const saveEditUser = () => {
    if (!editingUser) return;
    if (!editUserName.trim() || editUserPasscode.length !== 4) {
      alert("Enter a name and a 4-digit passcode");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...u, name: editUserName.trim(), passcode: editUserPasscode }
          : u
      )
    );

    setEditingUser(null);
  };

  const deleteUser = (userId) => {
    if (!window.confirm("Delete this user and all their data?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // --- CLOCKING ---

  const handleClockIn = () => {
    if (!currentUserId) return;
    const user = getUserById(currentUserId);
    if (!user || user.currentSessionStart) return;

    const nowDate = new Date();

    updateUser(currentUserId, (u) => ({
      ...u,
      currentSessionStart: nowDate,
      entries: [
        ...u.entries,
        {
          type: "Clock In",
          time: nowDate.toLocaleTimeString(),
          raw: nowDate
        }
      ]
    }));
  };

  const handleClockOut = (userIdOverride = null) => {
    const targetUserId = userIdOverride || currentUserId;
    if (!targetUserId) return;
    const user = getUserById(targetUserId);
    if (!user || !user.currentSessionStart) return;

    const nowDate = new Date();
    const durationMs = nowDate - new Date(user.currentSessionStart);
    const durationMinutes = Math.round(durationMs / 60000);

    updateUser(targetUserId, (u) => ({
      ...u,
      currentSessionStart: null,
      entries: [
        ...u.entries,
        {
          type: "Clock Out",
          time: nowDate.toLocaleTimeString(),
          raw: nowDate,
          durationMinutes
        }
      ]
    }));
  };

  // --- SETTINGS PAGE ---

  const SettingsPage = () => {
    const saveSettings = () => {
      localStorage.setItem("rounding", rounding);
      localStorage.setItem("autoClockOut", autoClockOut);
      localStorage.setItem("breakReminder", breakReminder);
      alert("Settings saved");
    };

    const resetData = () => {
      if (
        window.confirm(
          "Are you sure you want to delete ALL timeclock data for ALL users?"
        )
      ) {
        setUsers((prev) =>
          prev.map((u) => ({
            ...u,
            entries: [],
            currentSessionStart: null
          }))
        );
      }
    };

    return (
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          maxWidth: "600px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Settings</h2>

        <div style={{ marginBottom: "1.5rem" }}>
          <label>
            <strong>Rounding Rule</strong>
          </label>
          <select
            value={rounding}
            onChange={(e) => setRounding(e.target.value)}
            style={{ marginLeft: "1rem" }}
          >
            <option value="1">Nearest 1 minute</option>
            <option value="5">Nearest 5 minutes</option>
            <option value="6">Nearest 6 minutes</option>
            <option value="15">Nearest 15 minutes</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label>
            <strong>Auto Clock-Out</strong>
          </label>
          <select
            value={autoClockOut}
            onChange={(e) => setAutoClockOut(e.target.value)}
            style={{ marginLeft: "1rem" }}
          >
            <option value="none">Disabled</option>
            <option value="4">After 4 hours</option>
            <option value="6">After 6 hours</option>
            <option value="8">After 8 hours</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label>
            <strong>Break Reminder</strong>
          </label>
          <input
            type="checkbox"
            checked={breakReminder}
            onChange={(e) => setBreakReminder(e.target.checked)}
            style={{ marginLeft: "1rem" }}
          />
        </div>

        <button
          onClick={saveSettings}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            background: "#4caf50",
            color: "white",
            cursor: "pointer",
            marginRight: "1rem"
          }}
        >
          Save Settings
        </button>

        <button
          onClick={resetData}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            background: "#f44336",
            color: "white",
            cursor: "pointer"
          }}
        >
          Reset All Data
        </button>
      </div>
    );
  };

  // --- HISTORY PAGE ---

  const HistoryPage = () => {
    const visibleEntries = isAdmin
      ? allEntries
      : (getUserById(currentUserId)?.entries || []).map((e, index) => ({
          ...e,
          userId: currentUserId,
          userName: getUserById(currentUserId)?.name || "",
          _index: index
        }));

    const grouped = {};
    visibleEntries.forEach((entry) => {
      if (!entry.raw) return;
      const dateKey = new Date(entry.raw).toLocaleDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(entry);
    });

    const getTotalForDay = (dayEntries) =>
      dayEntries
        .filter((e) => e.durationMinutes)
        .reduce((sum, e) => sum + e.durationMinutes, 0);

    return (
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          maxWidth: "700px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>History</h2>

        {Object.keys(grouped).length === 0 && <p>No history yet.</p>}

        {Object.keys(grouped)
          .sort((a, b) => new Date(b) - new Date(a))
          .map((date) => {
            const dayEntries = grouped[date];
            const total = getTotalForDay(dayEntries);

            return (
              <div
                key={date}
                style={{
                  marginBottom: "1.5rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid #ddd"
                }}
              >
                <h3 style={{ marginBottom: "0.5rem" }}>
                  {date} — {formatHoursMinutes(total)}
                </h3>

                <ul style={{ paddingLeft: "1.2rem" }}>
                  {dayEntries.map((entry, index) => (
                    <li key={index} style={{ marginBottom: "0.4rem" }}>
                      {isAdmin && (
                        <span>
                          <strong>{entry.userName}</strong> —{" "}
                        </span>
                      )}
                      <strong>{entry.type}</strong> — {entry.time}
                      {entry.durationMinutes && (
                        <span>
                          {" "}
                          — Worked {formatHoursMinutes(entry.durationMinutes)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
      </div>
    );
  };

  // --- DASHBOARD PAGE ---

  const DashboardPage = () => {
    const user = currentUserId ? getUserById(currentUserId) : null;
    const userTotalMinutes = user ? totalMinutesForUser(user) : 0;
    const userWeeklyMinutes = user ? weeklyMinutesForUser(user) : 0;
    const liveMinutes =
      user && user.currentSessionStart
        ? Math.floor((now - new Date(user.currentSessionStart)) / 60000)
        : 0;

    return (
      <>
        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            maxWidth: "600px",
            marginBottom: "2rem"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Controls</h2>

          <button
            onClick={handleClockIn}
            disabled={!user || user.currentSessionStart}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "none",
              background: !user || user.currentSessionStart ? "#ccc" : "#4caf50",
              color: "white",
              cursor:
                !user || user.currentSessionStart ? "not-allowed" : "pointer",
              marginRight: "1rem"
            }}
          >
            Clock In
          </button>

          <button
            onClick={() => handleClockOut()}
            disabled={!user || !user.currentSessionStart}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "none",
              background:
                !user || !user.currentSessionStart ? "#ccc" : "#f44336",
              color: "white",
              cursor:
                !user || !user.currentSessionStart
                  ? "not-allowed"
                  : "pointer"
            }}
          >
            Clock Out
          </button>

          {user && user.currentSessionStart && (
            <div style={{ marginTop: "1rem", fontSize: "1.1rem" }}>
              Currently working:{" "}
              <strong>{formatHoursMinutes(liveMinutes)}</strong>
            </div>
          )}
        </div>

        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            maxWidth: "600px",
            marginBottom: "2rem"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Summary</h2>

          {user && (
            <>
              <p>
                <strong>{user.name}'s total worked:</strong>{" "}
                {formatHoursMinutes(userTotalMinutes)}
              </p>
              <p>
                <strong>{user.name}'s worked this week:</strong>{" "}
                {formatHoursMinutes(userWeeklyMinutes)}
              </p>
            </>
          )}

          <p>
            <strong>Total worked by all employees:</strong>{" "}
            {formatHoursMinutes(totalMinutesAllUsers)}
          </p>
          <p>
            <strong>Total worked by all employees this week:</strong>{" "}
            {formatHoursMinutes(weeklyMinutesAllUsers)}
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            maxWidth: "600px"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Today's Activity</h2>

          {user && user.entries.length > 0 ? (
            <ul style={{ paddingLeft: "1.2rem" }}>
              {user.entries.map((entry, index) => (
                <li key={index} style={{ marginBottom: "0.5rem" }}>
                  <strong>{entry.type}</strong> — {entry.time}
                  {entry.durationMinutes && (
                    <span>
                      {" "}
                      — Worked {formatHoursMinutes(entry.durationMinutes)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No entries yet.</p>
          )}

          {user && (
            <h3>Total Worked: {formatHoursMinutes(userTotalMinutes)}</h3>
          )}
        </div>
      </>
    );
  };

  // --- USERS PAGE ---

  const UsersPage = () => {
    const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          maxWidth: "800px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Users</h2>

        <button
          onClick={() => setShowAddUser(true)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "none",
            background: "#3b82f6",
            color: "white",
            cursor: "pointer",
            marginBottom: "1rem"
          }}
        >
          + Add User
        </button>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem"
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>Name</th>
              <th style={{ textAlign: "left", padding: "0.5rem" }}>
                Passcode
              </th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>
                Total
              </th>
              <th style={{ textAlign: "right", padding: "0.5rem" }}>
                This Week
              </th>
              <th style={{ padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem" }}>{u.name}</td>
                <td style={{ padding: "0.5rem" }}>{u.passcode}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>
                  {formatHoursMinutes(totalMinutesForUser(u))}
                </td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>
                  {formatHoursMinutes(weeklyMinutesForUser(u))}
                </td>
                <td style={{ padding: "0.5rem", textAlign: "center" }}>
                  <button
                    onClick={() => openEditUser(u)}
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      border: "none",
                      background: "#10b981",
                      color: "white",
                      cursor: "pointer",
                      marginRight: "0.25rem"
                    }}
                  >
                    Edit
                  </button>
                  {u.id !== "admin" && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        border: "none",
                        background: "#ef4444",
                        color: "white",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- ACTIVE SESSIONS PAGE ---

  const ActiveSessionsPage = () => {
    const activeUsers = users.filter((u) => u.currentSessionStart);

    return (
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          maxWidth: "700px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Active Sessions</h2>

        {activeUsers.length === 0 && <p>No one is currently clocked in.</p>}

        {activeUsers.length > 0 && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem"
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  User
                </th>
                <th style={{ textAlign: "left", padding: "0.5rem" }}>
                  Clock In
                </th>
                <th style={{ textAlign: "right", padding: "0.5rem" }}>
                  Worked
                </th>
                <th style={{ padding: "0.5rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((u) => {
                const minutes = Math.floor(
                  (now - new Date(u.currentSessionStart)) / 60000
                );
                return (
                  <tr key={u.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ padding: "0.5rem" }}>{u.name}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {new Date(u.currentSessionStart).toLocaleTimeString()}
                    </td>
                    <td
                      style={{
                        padding: "0.5rem",
                        textAlign: "right"
                      }}
                    >
                      {formatHoursMinutes(minutes)}
                    </td>
                    <td style={{ padding: "0.5rem", textAlign: "center" }}>
                      <button
                        onClick={() => handleClockOut(u.id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          border: "none",
                          background: "#f97316",
                          color: "white",
                          cursor: "pointer"
                        }}
                      >
                        Force Clock Out
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // --- PUNCH EDIT HELPERS ---

  const openEditPunch = (entry, userId, entryIndex) => {
    setEditingPunch({ userId, entryIndex });
    const inTime = entry.raw ? formatLocalDateTime(entry.raw) : "";
    const outTime = entry.durationMinutes
      ? formatLocalDateTime(
          new Date(new Date(entry.raw).getTime() + entry.durationMinutes * 60000)
        )
      : "";
    setEditPunchIn(inTime);
    setEditPunchOut(outTime);
    setEditPunchDuration(entry.durationMinutes || "");
  };

  const saveEditPunch = () => {
    if (!editingPunch) return;
    const { userId, entryIndex } = editingPunch;
    const user = getUserById(userId);
    if (!user) return;

    const inDate = parseLocalDateTime(editPunchIn);
    if (!inDate) {
      alert("Invalid Clock In format");
      return;
    }

    let outDate = null;
    let duration = parseInt(editPunchDuration, 10);

    if (editPunchOut.trim()) {
      outDate = parseLocalDateTime(editPunchOut);
      if (!outDate) {
        alert("Invalid Clock Out format");
        return;
      }
      duration = Math.round((outDate - inDate) / 60000);
    } else if (!isNaN(duration) && duration > 0) {
      outDate = new Date(inDate.getTime() + duration * 60000);
    }

    if (!outDate || isNaN(duration) || duration <= 0) {
      alert("Duration must be positive and Clock Out must be valid");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newEntries = [...u.entries];
        newEntries[entryIndex] = {
          ...newEntries[entryIndex],
          raw: inDate,
          time: inDate.toLocaleTimeString(),
          durationMinutes: duration
        };
        return { ...u, entries: newEntries };
      })
    );

    setEditingPunch(null);
  };

  const deletePunch = (userId, entryIndex) => {
    if (!window.confirm("Delete this punch?")) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newEntries = [...u.entries];
        newEntries.splice(entryIndex, 1);
        return { ...u, entries: newEntries };
      })
    );
  };

  const addPunchForUser = (userId) => {
    if (!userId) {
      alert("Select a user first");
      return;
    }

    const inStr = window.prompt(
      "Enter Clock In (MM/DD/YYYY HH:MM AM/PM):",
      formatLocalDateTime(new Date())
    );
    if (!inStr) return;
    const inDate = parseLocalDateTime(inStr);
    if (!inDate) {
      alert("Invalid Clock In format");
      return;
    }

    const outStr = window.prompt(
      "Enter Clock Out (MM/DD/YYYY HH:MM AM/PM):",
      formatLocalDateTime(new Date())
    );
    if (!outStr) return;
    const outDate = parseLocalDateTime(outStr);
    if (!outDate) {
      alert("Invalid Clock Out format");
      return;
    }

    const duration = Math.round((outDate - inDate) / 60000);
    if (duration <= 0) {
      alert("Clock Out must be after Clock In");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          entries: [
            ...u.entries,
            {
              type: "Clock Out",
              time: inDate.toLocaleTimeString(),
              raw: inDate,
              durationMinutes: duration
            }
          ]
        };
      })
    );
  };

  // --- CSV EXPORT ---

  const generateWeeklyCsv = () => {
    const rows = [];
    rows.push(["User", "Date", "Clock In", "Clock Out", "Duration (min)"]);

    const weekStartLocal = weekStart;
    const weekEndLocal = new Date(weekStartLocal);
    weekEndLocal.setDate(weekEndLocal.getDate() + 7);

    users.forEach((u) => {
      if (csvUserFilter !== "all" && csvUserFilter !== u.id) return;

      u.entries.forEach((e) => {
        if (!e.durationMinutes || !e.raw) return;
        const inDate = new Date(e.raw);
        if (inDate < weekStartLocal || inDate >= weekEndLocal) return;

        const outDate = new Date(
          inDate.getTime() + e.durationMinutes * 60000
        );

        rows.push([
          u.name,
          inDate.toLocaleDateString(),
          formatLocalDateTime(inDate),
          formatLocalDateTime(outDate),
          e.durationMinutes
        ]);
      });
    });

    const csvContent = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const weekLabel = weekStartLocal.toLocaleDateString().replace(/\//g, "-");
    link.download = `timeclock-week-${weekLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ExportCsvPage = () => {
    const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          maxWidth: "600px"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Export Weekly CSV</h2>

        <div style={{ marginBottom: "1rem" }}>
          <label>
            <strong>User</strong>
          </label>
          <select
            value={csvUserFilter}
            onChange={(e) => setCsvUserFilter(e.target.value)}
            style={{
              marginLeft: "0.5rem",
              padding: "0.25rem 0.5rem"
            }}
          >
            <option value="all">All Users</option>
            {sortedUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={generateWeeklyCsv}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            background: "#3b82f6",
            color: "white",
            cursor: "pointer"
          }}
        >
          Download CSV for Current Week
        </button>
      </div>
    );
  };

  // --- AUTH GATE ---

  if (!isAuthenticated) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  const currentUser = currentUserId ? getUserById(currentUserId) : null;

  // --- MAIN LAYOUT ---

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      <div
        style={{
          width: "260px",
          background: "#1e293b",
          color: "white",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div>
          <h2 style={{ marginTop: 0 }}>Timeclock</h2>
          <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Logged in as:{" "}
            <strong>{isAdmin ? "Admin" : currentUser?.name}</strong>
          </div>

          <nav style={{ marginTop: "2rem" }}>
            <div
              onClick={() => setCurrentPage("dashboard")}
              style={{
                marginBottom: "1rem",
                opacity: currentPage === "dashboard" ? 1 : 0.7,
                cursor: "pointer"
              }}
            >
              Dashboard
            </div>

            <div
              onClick={() => setCurrentPage("history")}
              style={{
                marginBottom: "1rem",
                opacity: currentPage === "history" ? 1 : 0.7,
                cursor: "pointer"
              }}
            >
              History
            </div>

            {isAdmin && (
              <>
                <div
                  onClick={() => setCurrentPage("settings")}
                  style={{
                    marginBottom: "1rem",
                    opacity: currentPage === "settings" ? 1 : 0.7,
                    cursor: "pointer"
                  }}
                >
                  Settings
                </div>

                <div
                  onClick={() => setCurrentPage("users")}
                  style={{
                    marginBottom: "1rem",
                    opacity: currentPage === "users" ? 1 : 0.7,
                    cursor: "pointer"
                  }}
                >
                  Users
                </div>

                <div
                  onClick={() => setCurrentPage("activeSessions")}
                  style={{
                    marginBottom: "1rem",
                    opacity:
                      currentPage === "activeSessions" ? 1 : 0.7,
                    cursor: "pointer"
                  }}
                >
                  Active Sessions
                </div>

                <div
                  onClick={() => setCurrentPage("editPunches")}
                  style={{
                    marginBottom: "1rem",
                    opacity:
                      currentPage === "editPunches" ? 1 : 0.7,
                    cursor: "pointer"
                  }}
                >
                  Edit Time Punches
                </div>

                <div
                  onClick={() => setCurrentPage("exportCsv")}
                  style={{
                    marginBottom: "1rem",
                    opacity:
                      currentPage === "exportCsv" ? 1 : 0.7,
                    cursor: "pointer"
                  }}
                >
                  Export CSV
                </div>
              </>
            )}
          </nav>
        </div>

        <div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "none",
              background: "#ef4444",
              color: "white",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, background: "#f5f7fa" }}>
        <div
          style={{
            background: "white",
            padding: "1rem 2rem",
            borderBottom: "1px solid #ddd",
            fontSize: "1.2rem",
            fontWeight: "bold"
          }}
        >
          {currentPage === "dashboard" && "Dashboard"}
          {currentPage === "history" && "History"}
          {currentPage === "settings" && "Settings"}
          {currentPage === "users" && "Users"}
          {currentPage === "activeSessions" && "Active Sessions"}
          {currentPage === "editPunches" && "Edit Time Punches"}
          {currentPage === "exportCsv" && "Export CSV"}
        </div>

        <div style={{ padding: "2rem" }}>
          {currentPage === "dashboard" && <DashboardPage />}
          {currentPage === "history" && <HistoryPage />}
          {currentPage === "settings" && isAdmin && <SettingsPage />}
          {currentPage === "users" && isAdmin && <UsersPage />}
          {currentPage === "activeSessions" && isAdmin && (
            <ActiveSessionsPage />
          )}
          {currentPage === "editPunches" && isAdmin && (
            <EditPunchesPage
              allEntries={allEntries}
              users={users}
              getUserById={getUserById}
              addPunchForUser={addPunchForUser}
              openEditPunch={openEditPunch}
              deletePunch={deletePunch}
              formatLocalDateTime={formatLocalDateTime}
              formatHoursMinutes={formatHoursMinutes}
            />
          )}
          {currentPage === "exportCsv" && isAdmin && <ExportCsvPage />}
        </div>
      </div>

      {isAdmin && showAddUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              minWidth: "320px"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Add New User</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label>
                <strong>Name</strong>
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.5rem"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label>
                <strong>4-digit Passcode</strong>
              </label>
              <input
                type="password"
                value={newUserPasscode}
                onChange={(e) => setNewUserPasscode(e.target.value)}
                maxLength={4}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.5rem"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowAddUser(false)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#e5e7eb",
                  marginRight: "0.5rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#3b82f6",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && editingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              minWidth: "320px"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Edit User</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label>
                <strong>Name</strong>
              </label>
              <input
                type="text"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.5rem"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label>
                <strong>4-digit Passcode</strong>
              </label>
              <input
                type="password"
                value={editUserPasscode}
                onChange={(e) => setEditUserPasscode(e.target.value)}
                maxLength={4}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.5rem"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#e5e7eb",
                  marginRight: "0.5rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEditUser}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && editingPunch && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              minWidth: "340px"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Edit Punch</h3>

            <div style={{ marginBottom: "1rem" }}>
              <label>
                <strong>Clock In</strong>
              </label>
              <input
                type="text"
                value={editPunchIn}
                onChange={(e) => setEditPunchIn(e.target.value)}
                placeholder="MM/DD/YYYY HH:MM AM/PM"
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.5rem"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label>
                <strong>Clock Out</strong>
              </label>
              <input
                type="text"
                value={editPunchOut}
                onChange={(e) => setEditPunchOut(e.target.value)}
                placeholder="MM/DD/YYYY HH:MM AM/PM"
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.5rem"
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label>
                <strong>Duration (minutes)</strong>
              </label>
              <input
                type="number"
                value={editPunchDuration}
                onChange={(e) => setEditPunchDuration(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  padding: "0.5rem"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingPunch(null)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#e5e7eb",
                  marginRight: "0.5rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEditPunch}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;