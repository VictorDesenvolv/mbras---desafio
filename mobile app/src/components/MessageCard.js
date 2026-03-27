import React from "react";
import { View, Text } from "react-native";
import SentimentBadge from "./SentimentBadge";

const HARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
};

const SMALL_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2,
};

export default function MessageCard({ message }) {
  const { user_id, content, timestamp, sentiment, flags, engagement_score } = message;

  return (
    <View
      className="bg-neo-card rounded-lg p-4 mb-3 border-3 border-neo-black"
      style={{ ...HARD_SHADOW, borderWidth: 3 }}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View
          className="bg-neo-blue px-2.5 py-1 rounded border-2 border-neo-black"
          style={SMALL_SHADOW}
        >
          <Text className="text-[11px] font-black text-neo-black">{user_id}</Text>
        </View>
        <Text className="text-[11px] font-bold text-gray-500">
          {new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>

      <Text className="text-sm font-semibold text-neo-black mb-3 leading-5">
        {content}
      </Text>

      <View className="flex-row justify-between items-center">
        <SentimentBadge label={sentiment.label} score={sentiment.score} />
        <View
          className="bg-neo-yellow px-3 py-1.5 rounded border-2 border-neo-black"
          style={SMALL_SHADOW}
        >
          <Text className="text-[11px] font-black text-neo-black">
            {engagement_score.toFixed(2)}
          </Text>
        </View>
      </View>

      {(flags.mbras_employee || flags.candidate_awareness || flags.special_pattern) && (
        <View className="flex-row mt-3 gap-2">
          {flags.mbras_employee && (
            <View className="bg-neo-cyan px-2.5 py-1 rounded border-2 border-neo-black" style={SMALL_SHADOW}>
              <Text className="text-[10px] font-black text-neo-black">MBRAS</Text>
            </View>
          )}
          {flags.candidate_awareness && (
            <View className="bg-neo-orange px-2.5 py-1 rounded border-2 border-neo-black" style={SMALL_SHADOW}>
              <Text className="text-[10px] font-black text-neo-black">CANDIDATO</Text>
            </View>
          )}
          {flags.special_pattern && (
            <View className="bg-neo-purple px-2.5 py-1 rounded border-2 border-neo-black" style={SMALL_SHADOW}>
              <Text className="text-[10px] font-black text-white">PADRÃO 42</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
