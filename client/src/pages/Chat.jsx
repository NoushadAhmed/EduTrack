import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAlert } from 'react-alert';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../components/StudentNavbar';
import StudentBackButton from '../components/StudentBackButton';
import Message from '../components/Message';
import { sendMessage, getPrivateConversation, getPrivateConversation2 } from '../redux/actions/studentAction';
import { colors, font, radius, shadow } from '../styles/theme';

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${colors.bgPage};
  font-family: ${font.family};
  html[data-student-portal='true'] & {
    box-sizing: border-box;
    height: 100vh;
    padding-top: 56px;
    padding-left: var(--student-sidebar-width, 240px);
    transition: padding-left 0.2s ease;
  }

  @media (max-width: 900px) {
    html[data-student-portal='true'] & { padding-left: 0; }
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
`;

const Window = styled.div`
  width: 100%;
  max-width: 720px;
  height: 100%;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.25s ease both;
`;

const ChatHeader = styled.div`
  padding: 14px 18px 0;
  border-bottom: 1px solid ${colors.border};
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid ${colors.border};
  align-items: flex-end;
`;

const MsgInput = styled.textarea`
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: 10px 14px;
  border: 1.5px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: 14px;
  font-family: ${font.family};
  color: ${colors.textPrimary};
  resize: none;
  outline: none;
  line-height: 1.5;

  &:focus {
    border-color: ${colors.borderFocus};
    box-shadow: 0 0 0 3px rgba(26,111,181,0.12);
  }
`;

const SendBtn = styled.button`
  height: 44px;
  padding: 0 20px;
  background: ${colors.primary};
  color: white;
  border: none;
  border-radius: ${radius.md};
  font-size: 14px;
  font-weight: 500;
  font-family: ${font.family};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover { background: ${colors.primaryHover}; }
`;

function swap(input, a, b) {
  const temp = input[a]; input[a] = input[b]; input[b] = temp;
}

const Chat = () => {
  const student = useSelector((s) => s.student);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const alert = useAlert();

  const [room1, setRoom1] = useState('');
  const [room2, setRoom2] = useState('');
  const [receiverRegistrationNumber, setReceiverRegistrationNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageArray, setMessageArray] = useState([]);
  const socketRef = useRef(null);

  const socketUrl = 'http://localhost:3000';

  useEffect(() => {
    const temp = params.room;
    const tempArr = temp.split('.');
    if (tempArr.length !== 2 || !tempArr[0] || !tempArr[1]) {
      navigate('/student/chatList', { replace: true });
      return;
    }
    setReceiverRegistrationNumber(tempArr[1]);
    setRoom1(temp);
    swap(tempArr, 0, 1);
    setRoom2(tempArr[0] + '.' + tempArr[1]);
  }, [navigate, params.room]);

  useEffect(() => {
    if (!room1 || !room2) return undefined;
    dispatch(getPrivateConversation(room1));
    dispatch(getPrivateConversation2(room2));
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem('studentToken') },
    });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join room', { room1, room2 }));
    socket.on('new Message', (data) => { setMessageArray((prev) => [...prev, data]); });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, room1, room2]);

  if (!student.isAuthenticated) { navigate('/'); return null; }

  const formHandler = (e) => {
    e.preventDefault();
    if (message.trim().length === 0) { alert.error('Message cannot be empty'); return; }
    socketRef.current?.emit('private message', { message, room: room1 });
    const messageObj = {
      roomId: room1,
      senderName: student.student.student.name,
      senderId: student.student.student._id,
      message,
      senderRegistrationNumber: student.student.student.registrationNumber,
      receiverRegistrationNumber,
    };
    dispatch(sendMessage(room1, messageObj));
    setMessage('');
  };

  return (
    <Page>
      <StudentNavbar />
      <ChatArea>
        <Window>
          <ChatHeader><StudentBackButton /></ChatHeader>
          <Messages>
            {student.privateChat.map((obj, index) => (
              <Message key={index} message={obj} own={obj.senderRegistrationNumber === student.student.student.registrationNumber} />
            ))}
            {messageArray.map((obj, index) => (
              <Message
                key={index}
                message={obj}
                own={obj.senderRegistrationNumber === student.student.student.registrationNumber}
              />
            ))}
          </Messages>
          <InputRow>
            <MsgInput
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message…"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); formHandler(e); } }}
            />
            <SendBtn onClick={formHandler}>Send</SendBtn>
          </InputRow>
        </Window>
      </ChatArea>
    </Page>
  );
};

export default Chat;
