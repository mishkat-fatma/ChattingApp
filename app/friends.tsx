import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, query, where } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "expo-router";

type User = {
  id: string;
  email: string;
};

type FriendRequest = {
  id: string;
  from: string;
  to: string;
  status: "pending" | "accepted" | "rejected";
};

export default function Friends() {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const data: User[] = querySnapshot.docs
        .filter((docSnap) => docSnap.id !== currentUser?.uid)
        .map((docSnap) => {
          const userData = docSnap.data() as Omit<User, "id">;
          return { id: docSnap.id, ...userData };
        });
      setUsers(data);
    };

    const fetchRequests = async () => {
      if (!currentUser) return;
      const q = query(collection(db, "friendRequests"), where("to", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const reqs: FriendRequest[] = querySnapshot.docs.map((docSnap) => {
        const reqData = docSnap.data() as Omit<FriendRequest, "id">;
        return { id: docSnap.id, ...reqData };
      });
      setRequests(reqs);
    };

    fetchUsers();
    fetchRequests();
  }, []);

  const sendRequest = async (toUserId: string) => {
    if (!currentUser) return;
    await addDoc(collection(db, "friendRequests"), {
      from: currentUser.uid,
      to: toUserId,
      status: "pending",
    });
    alert("Friend request sent!");
  };

  const acceptRequest = async (id: string) => {
    await updateDoc(doc(db, "friendRequests", id), { status: "accepted" });
    alert("Friend request accepted!");
  };

  const rejectRequest = async (id: string) => {
    await updateDoc(doc(db, "friendRequests", id), { status: "rejected" });
    alert("Friend request rejected!");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      Alert.alert("Logout failed", (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Friends</Text>
        <Button title="Logout" onPress={handleLogout} />
      </View>

      <TouchableOpacity style={styles.chatButton} onPress={() => router.push("/chat")}>
        <Text style={styles.chatButtonText}>Go to Chat</Text>
      </TouchableOpacity>

      <Text style={styles.subHeading}>All Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.userText}>{item.email}</Text>
            <Button title="Add Friend" onPress={() => sendRequest(item.id)} />
          </View>
        )}
      />

      <Text style={styles.subHeading}>Friend Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.userText}>From: {item.from}</Text>
            {item.status === "pending" ? (
              <>
                <Button title="Accept" onPress={() => acceptRequest(item.id)} />
                <Button title="Reject" onPress={() => rejectRequest(item.id)} />
              </>
            ) : (
              <Text>Status: {item.status}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#000" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heading: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  subHeading: { fontSize: 18, fontWeight: "bold", marginTop: 20, color: "#fff" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 8 },
  userText: { color: "#fff" },
  chatButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  chatButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
