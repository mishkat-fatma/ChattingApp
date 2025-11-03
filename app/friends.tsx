import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { getFirestore, collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "expo-router";

export default function Friends() {
  const db = getFirestore();
  const auth = getAuth();
  const router = useRouter();
  const user = auth.currentUser;

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "users")).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllUsers(list.filter((u) => u.id !== user.uid));
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "friendRequests"), where("to", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "friendRequests"), where("status", "==", "accepted"));
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map((d) => d.data());
      const friendIds = data
        .filter((r: any) => r.from === user.uid || r.to === user.uid)
        .map((r: any) => (r.from === user.uid ? r.to : r.from));
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFriends(users.filter((u) => friendIds.includes(u.id)));
    });
    return unsub;
  }, []);

  const sendRequest = async (to: string) => {
    if (!user) return;
    if (to === user.uid) return Alert.alert("You can't add yourself!");
    const all = await getDocs(collection(db, "friendRequests"));
    const exists = all.docs.find((d) => {
      const data = d.data();
      return (
        (data.from === user.uid && data.to === to) ||
        (data.from === to && data.to === user.uid)
      );
    });
    if (exists) return Alert.alert("Request already exists!");
    await addDoc(collection(db, "friendRequests"), { from: user.uid, to, status: "pending" });
    Alert.alert("Friend request sent!");
  };

  const handleRequest = async (id: string, status: "accepted" | "rejected") => {
    await updateDoc(doc(db, "friendRequests", id), { status });
  };

  const filtered = allUsers.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity style={styles.logout} onPress={() => { signOut(auth); router.replace("/login"); }}>
          <Text style={{ color: "#fff" }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Search by email"
        placeholderTextColor="#888"
        style={styles.input}
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.section}>Friend Requests</Text>
      {requests.length === 0 && <Text style={styles.text}>No requests</Text>}
      <FlatList
        data={requests}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.text}>
              {allUsers.find((u) => u.id === item.from)?.email || "Unknown"}
            </Text>
            {item.status === "pending" ? (
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btnGreen} onPress={() => handleRequest(item.id, "accepted")}>
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnRed} onPress={() => handleRequest(item.id, "rejected")}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.text}>{item.status}</Text>
            )}
          </View>
        )}
      />

      <Text style={styles.section}>All Users</Text>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.text}>{item.email}</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.btnBlue}
                onPress={() => router.push({ pathname: "/chat", params: { id: item.id, email: item.email } })}
              >
                <Text style={styles.btnText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnOrange} onPress={() => sendRequest(item.id)}>
                <Text style={styles.btnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Text style={styles.section}>My Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.text}>{item.email}</Text>
            <TouchableOpacity
              style={styles.btnBlue}
              onPress={() => router.push({ pathname: "/chat", params: { id: item.id, email: item.email } })}
            >
              <Text style={styles.btnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  logout: { backgroundColor: "#333", padding: 8, borderRadius: 8 },
  input: { backgroundColor: "#111", color: "#fff", borderRadius: 8, padding: 10, marginVertical: 10 },
  section: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111", padding: 10, borderRadius: 8, marginVertical: 4 },
  text: { color: "#fff" },
  btnRow: { flexDirection: "row", gap: 6 },
  btnText: { color: "#fff" },
  btnGreen: { backgroundColor: "#4CAF50", padding: 6, borderRadius: 6 },
  btnRed: { backgroundColor: "#E53935", padding: 6, borderRadius: 6 },
  btnBlue: { backgroundColor: "#2196F3", padding: 6, borderRadius: 6 },
  btnOrange: { backgroundColor: "#FF9800", padding: 6, borderRadius: 6 },
});
