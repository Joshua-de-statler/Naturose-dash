document.addEventListener('DOMContentLoaded', async () => {

    const SUPABASE_URL = 'https://xirlamryohwhveunabha.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcmxhbXJ5b2h3aHZldW5hYmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTQ5NzcsImV4cCI6MjA3MTE3MDk3N30.nZLcgCOrsZvglYR60T47TFir_bNfG_E4jHLZ5HStgpM';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');

    if (!userId) {
        document.getElementById('user-name').textContent = 'Error: No user specified';
        return;
    }

    const { data: user, error: userError } = await supabase.from('whatsapp_users').select('*').eq('id', userId).single();
    if (userError) {
        document.getElementById('user-name').textContent = 'User Not Found';
        console.error(userError);
        return;
    }

    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-details').innerHTML = `
        <strong>ID:</strong> ${user.id}<br>
        <strong>WA ID:</strong> ${user.wa_id}<br>
        <strong>Company ID:</strong> ${user.company_id}<br>
    `;

    const { data: conversations, error: convoError } = await supabase
        .from('conversations')
        .select('*, messages(*)')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

    if (convoError) {
        console.error(convoError);
    }
    
    // Function to group messages into user-bot interactions
    function groupMessagesByInteraction(messages) {
        if (!messages || messages.length === 0) return [];
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const interactions = [];
        let currentInteraction = [];

        sortedMessages.forEach(message => {
            if (message.sender_type === 'user') {
                if (currentInteraction.length > 0) {
                    interactions.push(currentInteraction);
                }
                currentInteraction = [message];
            } else if (message.sender_type === 'bot') {
                if (currentInteraction.length > 0 && currentInteraction[0].sender_type === 'user') {
                    currentInteraction.push(message);
                    interactions.push(currentInteraction);
                    currentInteraction = [];
                } else {
                    currentInteraction.push(message);
                }
            }
        });
        if (currentInteraction.length > 0) {
            interactions.push(currentInteraction);
        }
        return interactions;
    }

    const conversationListElement = document.getElementById('conversation-list');
    if (conversations && conversations.length > 0) {
        conversations.forEach(convo => {
            const li = document.createElement('li');
            const interactions = groupMessagesByInteraction(convo.messages);
            li.innerHTML = `
                <h4>Conversation ID: ${convo.id}</h4>
                <p><strong>Date:</strong> ${new Date(convo.started_at).toLocaleString()}</p>
                <div class="messages">
                    <ul style="list-style: none; padding-left: 10px;">
                        ${interactions.map(interaction => `
                            <li class="conversation-section">
                                ${interaction.map(message => `
                                    <hr>
                                    <div><strong>${message.sender_type}:</strong> ${message.content}</div>
                                `).join('')}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            conversationListElement.appendChild(li);
        });
    } else {
        conversationListElement.innerHTML = '<li>No conversations found for this user.</li>';
    }
});
