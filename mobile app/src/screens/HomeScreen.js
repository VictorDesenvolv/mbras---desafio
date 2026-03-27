import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { analyzeFeed } from "../api";

const SAMPLE_MESSAGES = [
  {
    user_id: "user_alice_01",
    content: "Adorei o novo produto! Muito bom! #produto #qualidade",
    hashtags: ["#produto", "#qualidade"],
  },
  {
    user_id: "user_bob_02",
    content: "Não gostei do atendimento #atendimento",
    hashtags: ["#atendimento"],
  },
  {
    user_id: "user_carol_03",
    content: "O produto é razoável #produto",
    hashtags: ["#produto"],
  },
];

const CARD = {
  shadowColor: "#000",
  shadowOffset: { width: 5, height: 5 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 5,
  borderWidth: 3,
  borderColor: "#000",
};

const CHIP = {
  shadowColor: "#000",
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2,
};

const BTN = {
  shadowColor: "#000",
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
};

export default function HomeScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState("user_");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [timeWindow, setTimeWindow] = useState("60");
  const [loading, setLoading] = useState(false);

  const addMessage = () => {
    if (!userId.trim() || !content.trim()) {
      Alert.alert("Erro", "Preencha user_id e conteúdo");
      return;
    }
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const hashtagList = hashtags
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h.startsWith("#"));

    setMessages((prev) => [
      ...prev,
      { user_id: userId.trim(), content: content.trim(), timestamp: now, hashtags: hashtagList },
    ]);
    setContent("");
    setHashtags("");
  };

  const loadSampleData = () => {
    const now = new Date();
    const samples = SAMPLE_MESSAGES.map((m, i) => ({
      ...m,
      timestamp: new Date(now.getTime() - i * 60000).toISOString().replace(/\.\d{3}Z$/, "Z"),
    }));
    setMessages(samples);
  };

  const submitAnalysis = async () => {
    if (messages.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos uma mensagem");
      return;
    }
    const tw = parseFloat(timeWindow);
    if (isNaN(tw) || tw <= 0) {
      Alert.alert("Erro", "Janela temporal deve ser > 0");
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeFeed(messages, tw);
      navigation.navigate("Results", { result });
    } catch (err) {
      Alert.alert("Erro na API", err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeMessage = (index) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="flex-1 bg-neo-bg" contentContainerClassName="p-4 pb-10">
        <View
          className="bg-neo-yellow rounded-lg p-6 mb-5"
          style={CARD}
        >
          <Text className="text-4xl font-black text-neo-black tracking-tighter">
            MBRAS
          </Text>
          <Text className="text-base font-bold text-neo-black mt-1">
            SENTIMENT ANALYZER
          </Text>
          <View className="flex-row mt-4 gap-2 flex-wrap">
            {["LEXICON", "SHA-256", "NFKD", "REAL-TIME"].map((tag) => (
              <View
                key={tag}
                className="bg-neo-card px-3 py-1 rounded border-2 border-neo-black"
                style={CHIP}
              >
                <Text className="text-[10px] font-black text-neo-black">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="bg-neo-card rounded-lg p-5 mb-4" style={CARD}>
          <Text className="text-base font-black text-neo-black uppercase tracking-wider mb-4">
            Nova Mensagem
          </Text>

          <Text className="text-[11px] font-black text-neo-black uppercase tracking-wider mb-1">
            Username
          </Text>
          <TextInput
            className="border-2 border-neo-black rounded-md px-4 py-3 text-sm font-semibold text-neo-black bg-neo-bg mb-3"
            value={userId}
            onChangeText={setUserId}
            placeholder="user_nome_123"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />

          <Text className="text-[11px] font-black text-neo-black uppercase tracking-wider mb-1">
            Conteúdo
          </Text>
          <TextInput
            className="border-2 border-neo-black rounded-md px-4 py-3 text-sm font-semibold text-neo-black bg-neo-bg mb-1 min-h-[80px]"
            style={{ textAlignVertical: "top" }}
            value={content}
            onChangeText={setContent}
            placeholder="Digite a mensagem..."
            placeholderTextColor="#999"
            multiline
            maxLength={280}
          />
          <Text className="text-[10px] font-bold text-gray-500 text-right mb-3">
            {content.length}/280
          </Text>

          <Text className="text-[11px] font-black text-neo-black uppercase tracking-wider mb-1">
            Hashtags (vírgula)
          </Text>
          <TextInput
            className="border-2 border-neo-black rounded-md px-4 py-3 text-sm font-semibold text-neo-black bg-neo-bg mb-4"
            value={hashtags}
            onChangeText={setHashtags}
            placeholder="#produto, #qualidade"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />

          <TouchableOpacity
            className="bg-neo-blue rounded-md py-3.5 items-center border-2 border-neo-black"
            style={BTN}
            onPress={addMessage}
          >
            <Text className="text-neo-black font-black text-sm uppercase">+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-neo-card rounded-lg p-5 mb-4" style={CARD}>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-black text-neo-black uppercase tracking-wider">
              Feed ({messages.length})
            </Text>
            <TouchableOpacity
              className="bg-neo-orange px-3.5 py-2 rounded border-2 border-neo-black"
              style={CHIP}
              onPress={loadSampleData}
            >
              <Text className="text-[10px] font-black text-neo-black uppercase">Demonstração</Text>
            </TouchableOpacity>
          </View>

          {messages.length === 0 ? (
            <View className="py-10 items-center">
              <Text className="text-sm font-bold text-gray-400 text-center">
                Nenhuma mensagem.
              </Text>
            </View>
          ) : (
            messages.map((msg, idx) => (
              <View
                key={idx}
                className="flex-row items-center bg-neo-bg rounded-md p-3 mb-2 border-2 border-neo-black"
              >
                <View className="flex-1">
                  <Text className="text-[11px] font-black text-neo-black">{msg.user_id}</Text>
                  <Text className="text-[13px] font-semibold text-neo-black mt-0.5" numberOfLines={2}>
                    {msg.content}
                  </Text>
                  {msg.hashtags.length > 0 && (
                    <Text className="text-[11px] font-bold text-neo-purple mt-0.5">
                      {msg.hashtags.join("  ")}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded bg-neo-red justify-center items-center ml-2 border-2 border-neo-black"
                  style={CHIP}
                  onPress={() => removeMessage(idx)}
                >
                  <Text className="text-neo-black font-black text-xs">✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {messages.length > 0 && (
            <TouchableOpacity
              className="items-center mt-2 py-2"
              onPress={() => setMessages([])}
            >
              <Text className="text-neo-red font-black text-xs uppercase tracking-wide">
                Limpar Tudo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-neo-card rounded-lg p-5 mb-4" style={CARD}>
          <Text className="text-[11px] font-black text-neo-black uppercase tracking-wider mb-1">
            Janela Temporal (min)
          </Text>
          <TextInput
            className="border-2 border-neo-black rounded-md px-4 py-3 text-sm font-semibold text-neo-black bg-neo-bg mb-5"
            value={timeWindow}
            onChangeText={setTimeWindow}
            placeholder="60"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            className={`bg-neo-pink rounded-md py-4 items-center border-3 border-neo-black ${loading ? "opacity-60" : ""}`}
            style={{ ...BTN, borderWidth: 3 }}
            onPress={submitAnalysis}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-neo-black text-lg font-black uppercase tracking-wider">
                Analisar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
