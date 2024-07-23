import React, { useState } from 'react';
import { gql, useQuery, useMutation, useSubscription } from '@apollo/client';
import MessageList from './MessageList';
import styles from './Messages.module.scss';
import {
  GET_MESSAGES,
  ADD_MESSAGE,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
  MESSAGE_ADDED,
  MESSAGE_UPDATED,
  MESSAGE_DELETED,
} from './graphql/operations';


const Messages: React.FC = () => {
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { data, loading, error } = useQuery(GET_MESSAGES);

  const [addMessage] = useMutation(ADD_MESSAGE);
  const [updateMessage] = useMutation(UPDATE_MESSAGE);
  const [deleteMessage] = useMutation(DELETE_MESSAGE);

  useSubscription(MESSAGE_ADDED, {
    onSubscriptionData: ({ client, subscriptionData }) => {
      client.cache.modify({
        fields: {
          messages(existingMessages = []) {
            const newMessageRef = client.cache.writeFragment({
              data: subscriptionData.data.messageAdded,
              fragment: gql`
                fragment NewMessage on Message {
                  id
                  content
                }
              `,
            });
            return [...existingMessages, newMessageRef];
          },
        },
      });
    },
  });

  useSubscription(MESSAGE_UPDATED, {
    onSubscriptionData: ({ client, subscriptionData }) => {
      client.cache.modify({
        fields: {
          messages(existingMessages = []) {
            return existingMessages.map((message: any) => {
              message.__ref === `Message:${subscriptionData.data.messagesUpdated.id}`
              ? client.cache.writeFragment({
                data: subscriptionData.data.messageUpdated,
                fragment: gql`
                  fragment: UpdatedMessage on Message {
                    id
                    content
                  }
                `,
              })
              : message
            });
          },
        },
      });
    },
  });

  useSubscription(MESSAGE_DELETED, {
    onSubscriptionData: ({ client, subscriptionData }) => {
      client.cache.modify({
        fields: {
          messages(existingMessages = []) {
            return existingMessages.filter(
              (message: any) => message.__ref !== `Message:${subscriptionData.data.messageDeleted.id}`
            );
          },
        },
      });
    },
  });

  const handleAddMessage = () => {
    if (!content.trim()) {
      setErrorMessage('Message can not be empty, Please Enter your Message...');
      return;
    }
    addMessage({ variables: { content }});
    setContent('');
    setErrorMessage('');
  };

  interface Message {
    id: string;
    content: string;
  };

  const handleUpdateMessage = (id: string) => {
    const messageObj = data.messages.find((msg: Message) => msg.id === id);
    if (messageObj) {
      const newContent = prompt('Enter new content:', `${messageObj.content}`);
      if (newContent) {
        updateMessage({ variables: { id, content: newContent }});
      }
    }
  };

  const handleDeleteMessage = (id: string) => {
    deleteMessage({ variables: { id }});
  };

  if (loading) return <p>Loading..</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <div className={styles.container}>

      <MessageList handleUpdate={handleUpdateMessage} handleDelete={handleDeleteMessage} data={data} />

      <div className={styles.inputGroup}>
        <input type="text" value={content} onChange={e => setContent(e.target.value)} />
        <button onClick={handleAddMessage}>Add Message</button>
      </div>
      {errorMessage && <span className={styles['error-text']}>{errorMessage}<button className={styles.close} onClick={() => setErrorMessage('')}>Close</button></span>}
    </div>
  );
};

export default Messages;