import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import MessageCard from "../components/MessageCard";
import DistributionBar from "../components/DistributionBar";

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

const RANK_COLORS = ["bg-neo-yellow", "bg-neo-blue", "bg-neo-pink", "bg-neo-lime", "bg-neo-cyan"];

export default function ResultsScreen({ route, navigation }) {
  const { result } = route.params;
  const analysis = result.analysis;

  return (
    <ScrollView className="flex-1 bg-neo-bg" contentContainerClassName="p-4 pb-10">
      <View className="bg-neo-green rounded-lg p-6 mb-4" style={CARD}>
        <Text className="text-xl font-black text-neo-black uppercase tracking-wider mb-4">
          Resultado
        </Text>
        <View className="flex-row justify-around">
          <MetaStat label="TOTAL" value={analysis.metadata.total_messages} bg="bg-neo-card" />
          <MetaStat label="JANELA" value={analysis.metadata.messages_in_window} bg="bg-neo-yellow" />
          <MetaStat label="MIN" value={analysis.metadata.time_window_minutes} bg="bg-neo-blue" />
        </View>
      </View>

      <DistributionBar distribution={analysis.sentiment_distribution} />

      {analysis.trending_topics.length > 0 && (
        <View className="bg-neo-card rounded-lg p-5 mb-4" style={CARD}>
          <Text className="text-base font-black text-neo-black uppercase tracking-wider mb-4">
            Trending
          </Text>
          {analysis.trending_topics.map((topic, idx) => (
            <View key={idx} className="flex-row items-center mb-3">
              <View
                className={`w-8 h-8 rounded justify-center items-center mr-3 border-2 border-neo-black ${RANK_COLORS[idx] || "bg-gray-200"}`}
                style={CHIP}
              >
                <Text className="text-xs font-black text-neo-black">{idx + 1}</Text>
              </View>
              <View className="flex-1 mr-3">
                <Text className="text-sm font-black text-neo-black">{topic.hashtag}</Text>
                <Text className="text-[11px] font-semibold text-gray-500 mt-0.5">
                  {topic.score.toFixed(2)} pts · {topic.count}x
                </Text>
              </View>
              <View className="w-16 h-3 rounded border-2 border-neo-black overflow-hidden bg-neo-bg">
                <View
                  className="h-full bg-neo-orange"
                  style={{
                    width: `${Math.min(100, (topic.score / (analysis.trending_topics[0]?.score || 1)) * 100)}%`,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      <View className="bg-neo-card rounded-lg p-5 mb-4" style={CARD}>
        <Text className="text-base font-black text-neo-black uppercase tracking-wider mb-4">
          Anomalias
        </Text>

        <AnomalyRow
          label="BURST"
          icon="🔥"
          items={analysis.anomalies.burst_users}
          emptyText="Nenhum burst"
          chipBg="bg-neo-red"
        />
        <AnomalyRow
          label="ALTERNANTE"
          icon="🔄"
          items={analysis.anomalies.alternating_sentiment_users}
          emptyText="Nenhum padrão"
          chipBg="bg-neo-purple"
        />

        <View className="mb-2">
          <Text className="text-[11px] font-black text-neo-black uppercase tracking-wider mb-2">
            ⚡ SINCRONIZADO
          </Text>
          {analysis.anomalies.synchronized_groups.length > 0 ? (
            analysis.anomalies.synchronized_groups.map((g, i) => (
              <View
                key={i}
                className="bg-neo-orange rounded p-2.5 mb-1.5 border-2 border-neo-black"
                style={CHIP}
              >
                <Text className="text-[11px] font-bold text-neo-black">
                  {g.message_count} msgs · {g.user_ids.join(", ")}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-xs font-semibold text-gray-400 ml-1">
              Nenhuma postagem sincronizada
            </Text>
          )}
        </View>
      </View>

      <View className="bg-neo-card rounded-lg p-5 mb-4" style={CARD}>
        <Text className="text-base font-black text-neo-black uppercase tracking-wider mb-4">
          Mensagens ({analysis.messages.length})
        </Text>
        {analysis.messages.map((msg, idx) => (
          <MessageCard key={idx} message={msg} />
        ))}
      </View>

      <TouchableOpacity
        className="bg-neo-blue rounded-lg py-4 items-center mb-5 border-2 border-neo-black"
        style={BTN}
        onPress={() => navigation.goBack()}
      >
        <Text className="text-neo-black text-base font-black uppercase tracking-wider">
          Nova Análise
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MetaStat({ label, value, bg }) {
  return (
    <View
      className={`items-center px-4 py-2.5 rounded border-2 border-neo-black ${bg}`}
      style={CHIP}
    >
      <Text className="text-2xl font-black text-neo-black">{value}</Text>
      <Text className="text-[10px] font-black text-neo-black tracking-wider mt-0.5">{label}</Text>
    </View>
  );
}

function AnomalyRow({ label, icon, items, emptyText, chipBg }) {
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-black text-neo-black uppercase tracking-wider mb-2">
        {icon} {label}
      </Text>
      {items.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {items.map((item, i) => (
            <View
              key={i}
              className={`px-3 py-1.5 rounded border-2 border-neo-black ${chipBg}`}
              style={CHIP}
            >
              <Text className="text-[11px] font-black text-neo-black">{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-xs font-semibold text-gray-400 ml-1">{emptyText}</Text>
      )}
    </View>
  );
}
