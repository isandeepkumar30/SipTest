// File Location: src/constants/CallStates.js

export const CALL_STATES = {
    IDLE: 'IDLE',           // No call activity
    RINGING: 'RINGING',     // Incoming call ringing
    OFFHOOK: 'OFFHOOK',     // Call answered/active
    OUTGOING: 'OUTGOING'    // Outgoing call initiated
};

export const getCallStateDescription = ( state ) =>
{
    switch ( state )
    {
        case CALL_STATES.IDLE:
            return 'No active calls';
        case CALL_STATES.RINGING:
            return 'Incoming call ringing';
        case CALL_STATES.OFFHOOK:
            return 'Call is active';
        case CALL_STATES.OUTGOING:
            return 'Outgoing call initiated';
        default:
            return 'Unknown call state';
    }
};

export const getCallStateIcon = ( state ) =>
{
    switch ( state )
    {
        case CALL_STATES.IDLE:
            return '📵';
        case CALL_STATES.RINGING:
            return '📞';
        case CALL_STATES.OFFHOOK:
            return '☎️';
        case CALL_STATES.OUTGOING:
            return '📱';
        default:
            return '❓';
    }
};