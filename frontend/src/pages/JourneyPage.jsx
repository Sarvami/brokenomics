/**
 * JourneyPage — /topic/:topicId/subtopic/:subTopicId
 * Looks up the topic and sub-topic from local data, then renders JourneyView.
 */

import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { TOPIC_DATA } from '../hooks/useTopics';
import JourneyView from '../components/journey/JourneyView';

export default function JourneyPage() {
  const { topicId, subTopicId } = useParams();

  const topic = useMemo(
    () => TOPIC_DATA.find((t) => t.id === topicId),
    [topicId]
  );

  const subTopic = useMemo(
    () => topic?.subTopics?.find((s) => s.id === subTopicId),
    [topic, subTopicId]
  );

  // If topic not found, redirect home
  if (!topic) return <Navigate to="/" replace />;

  return <JourneyView topic={topic} subTopic={subTopic || topic.subTopics?.[0]} />;
}
