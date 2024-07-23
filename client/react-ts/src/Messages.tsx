import React, { useState } from 'react';
import MessageList from './MessageList';
import { useMessages } from './hooks/useMessages';
import MessageEditModal from './components/modal/MessageEditModal';
import styles from './Messages.module.scss';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const Messages: React.FC = () => {
  const {
    data,
    loading,
    error,
    errorMessage,
    handleAddMessage,
    handleUpdateMessage,
    handleDeleteMessage,
    setErrorMessage,
  } = useMessages();

  const [content, setContent] = useState('');
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  interface Message {
    id: string;
    content: string;
  };

  const handleUpdate = (id: string) => {
    const messageObj = data.messages.find((msg: Message) => msg.id === id);
    if (messageObj) {
      setCurrentMessageId(id);
      setModalContent(messageObj.content);
      setIsModalOpen(true);
    }
  };

  const handleModalSubmit = (newContent: string) => {
    if (currentMessageId) {
      handleUpdateMessage(currentMessageId, newContent);
      setIsModalOpen(false); // Close the modal after submission
      setErrorMessage(''); // Clear the error message
    }
  };

  if (loading) return <p>Loading..</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <div className={styles.container}>
      <ToastContainer/>

      <MessageList handleUpdate={handleUpdate} handleDelete={handleDeleteMessage} data={data} />

      <div className={styles.inputGroup}>
        <input type="text" value={content} onChange={e => setContent(e.target.value)} />
        <button onClick={handleAddMessage}>Add Message</button>
      </div>
      {errorMessage && <span className={styles['error-text']}>{errorMessage}<button className={styles.close} onClick={() => setErrorMessage('')}>Close</button></span>}

      <MessageEditModal
        isOpen={isModalOpen}
        content={modalContent}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default Messages;