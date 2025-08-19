document.addEventListener('DOMContentLoaded', () => {

    // IMPORTANT: Replace with your actual Supabase URL and public key
    const SUPABASE_URL = 'https://xirlamryohwhveunabha.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcmxhbXJ5b2h3aHZldW5hYmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTQ5NzcsImV4cCI6MjA3MTE3MDk3N30.nZLcgCOrsZvglYR60T47TFir_bNfG_E4jHLZ5HStgpM';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function fetchDashboardData() {
        const { count: totalUsers } = await supabase.from('whatsapp_users').select('*', { count: 'exact', head: true });
        document.getElementById('total-users-value').textContent = totalUsers || 0;

        const { data: users, error: userError } = await supabase.from('whatsapp_users').select('*').order('created_at', { ascending: false }).limit(3);
        if (userError) {
            console.error('Error fetching users:', userError);
            return;
        }
        
        const userListElement = document.getElementById('user-contact-list');
        userListElement.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            const userInfoDiv = document.createElement('div');
            userInfoDiv.innerHTML = `<strong>Name:</strong> ${user.name}<br><strong>ID:</strong> ${user.wa_id}`;
            const infoButton = document.createElement('a');
            infoButton.textContent = 'Info';
            infoButton.href = `user-details.html?userId=${user.id}`;
            infoButton.className = 'info-button';
            li.appendChild(userInfoDiv);
            li.appendChild(infoButton);
            userListElement.appendChild(li);
        });

        const { data: conversations, error: convoError } = await supabase
            .from('conversations')
            .select('started_at')
            .order('started_at', { ascending: true });

        if (convoError) {
            console.error('Error fetching conversations for chart:', convoError);
            return;
        }

        const dailyData = {};
        conversations.forEach(convo => {
            const date = new Date(convo.started_at);
            const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
            dailyData[dayLabel] = (dailyData[dayLabel] || 0) + 1;
        });

        const labels = Object.keys(dailyData);
        const dataPoints = Object.values(dailyData);
        
        // Add a starting point at (0,0)
        labels.unshift('Start');
        dataPoints.unshift(0);

        const conversationData = {
            labels: labels,
            datasets: [{
                label: 'Daily Conversations',
                data: dataPoints,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: true
            }]
        };
        const ctx = document.getElementById('conversation-chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: conversationData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: true,
                            maxTicksLimit: 15
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    fetchDashboardData();
});
