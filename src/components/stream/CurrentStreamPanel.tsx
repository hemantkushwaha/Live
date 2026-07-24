import React, { useState, useEffect } from 'react';
import { StreamRoom } from '../../../shared/types';
import { CreatorDashboard } from '../creator/CreatorDashboard';
import { PendingRequestsPanel } from '../privateRequest/PendingRequestsPanel';
import { CreatorSettingsModal } from '../economy/CreatorSettingsModal';
import { useSignaling } from '../../contexts/SignalingContext';

interface CurrentStreamPanelProps {
  currentStream: StreamRoom;
  onEndStream: () => Promise<void>;
  isEndingStream: boolean;
}

export const CurrentStreamPanel: React.FC<CurrentStreamPanelProps> = ({
  currentStream,
  onEndStream,
  isEndingStream,
}) => {
  const { socket } = useSignaling();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      <CreatorDashboard
        currentStream={currentStream}
        onEndStream={onEndStream}
        isEndingStream={isEndingStream}
      />

      {/* Streamer Pending Call Requests Panel */}
      <PendingRequestsPanel streamId={currentStream.id} socket={socket} />

      {/* Creator Settings Modal */}
      <CreatorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        socket={socket}
      />
    </div>
  );
};
