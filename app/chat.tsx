import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useLocalSearchParams } from "expo-router";

export default function Chat() {
  const db = getFirestore();
  const auth = getAuth();
  const { id, email } = useLocalSearchParams();
  const user = auth.currentUser;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    const findChat = async () => {
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
      );
      const snap = await getDocs(q);
      const found = snap.docs.find((d) => d.data().participants.includes(id));
      if (found) setChatId(found.id);
      else {
        const newChat = await addDoc(collection(db, "chats"), {
          participants: [user.uid, id],
        });
        setChatId(newChat.id);
      }
    };
    findChat();
  }, [id]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [chatId]);

  const send = async () => {
    if (!text.trim() || !chatId) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      from: user?.uid,
      text,
      createdAt: new Date(),
    });
    setText("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat with {email}</Text>
      <FlatList
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msg,
              { alignSelf: item.from === user?.uid ? "flex-end" : "flex-start", backgroundColor: item.from === user?.uid ? "#2196F3" : "#333" },
            ]}
          >
            <Text style={{ color: "#fff" }}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Type..." placeholderTextColor="#888" />
        <TouchableOpacity style={styles.send} onPress={send}>
          <Text style={{ color: "#fff" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 12 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  msg: { padding: 10, borderRadius: 8, marginVertical: 4, maxWidth: "75%" },
  inputRow: { flexDirection: "row", marginTop: 10, alignItems: "center" },
  input: { flex: 1, backgroundColor: "#111", color: "#fff", borderRadius: 8, padding: 10 },
  send: { marginLeft: 8, backgroundColor: "#4CAF50", padding: 10, borderRadius: 8 },
});
