import { useState } from 'react';
import { gql, useQuery, useMutation, useSubscription } from '@apollo/client';
import { toast } from 'react-toastify';
import {
  GET_MESSAGES,
  ADD_MESSAGE,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
  MESSAGE_ADDED,
  MESSAGE_UPDATED,
  MESSAGE_DELETED,
} from '../graphql/operations';

export const useMessages = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const { data, loading, error } = useQuery(GET_MESSAGES, {
    fetchPolicy: 'cache-and-network',
  });

  const [addMessage] = useMutation(ADD_MESSAGE, {
    onCompleted: () => {
      toast.success("Messages added successfully!")
    }
  });
  
  const [updateMessage] = useMutation(UPDATE_MESSAGE, {
    onCompleted: () => {
      toast.success("Messages updated successfully!")
    }
  });

  const [deleteMessage] = useMutation(DELETE_MESSAGE, {
    onCompleted: () => {
      toast.success("Messages deleted successfully!")
    }
  });

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

  const handleAddMessage = (content: string) => {
    console.log('content', content);
    if (!content.trim()) {
      setErrorMessage('Message can not be empty, Please Enter your Message...');
      return;
    }
    addMessage({ variables: { content }});
    setErrorMessage('');
  };

  const handleUpdateMessage = (id: string, newContent: string) => {
    updateMessage({ variables: { id, content: newContent } });
  };

  const handleDeleteMessage = (id: string) => {
    deleteMessage({ variables: { id } });
  };

  return {
    data,
    loading,
    error,
    errorMessage,
    handleAddMessage,
    handleUpdateMessage,
    handleDeleteMessage,
    setErrorMessage,
  };
}