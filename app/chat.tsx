import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

type Message = {
  id: string;
  text: string;
  userId: string;
  createdAt: number;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Message[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<Message, "id">;
        return { id: docSnap.id, ...data };
      });
      setMessages(list);
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (text.trim() === "" || !currentUser) return;
    await addDoc(collection(db, "messages"), {
      text,
      userId: currentUser.uid,
      createdAt: Date.now(),
    });
    setText("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Chat Room</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBox,
              item.userId === currentUser?.uid ? styles.myMsg : styles.otherMsg,
            ]}
          >
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.chatArea}
      />

      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
  chatArea: {
    paddingBottom: 10,
  },
  messageBox: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
    maxWidth: "80%",
  },
  myMsg: {
    alignSelf: "flex-end",
    backgroundColor: "#043e7cff",
  },
  otherMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#333",
  },
  msgText: {
    fontSize: 16,
    color: "white",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendButton: {
    backgroundColor: "#043e7cff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendText: {
    color: "white",
    fontWeight: "600",
  },
});
