import { app } from '../server/index';
import { INITIAL_CONVEYOR, INITIAL_SPLICES, INITIAL_ALERTS, INITIAL_MAINTENANCE_TASKS, INITIAL_SENSOR_HEALTH, INITIAL_SPARE_READINESS } from '../src/data/mockData';
import http from 'http';

const server = http.createServer(app);

const testQueries = [
  'hy bro!!',
  'plant status?',
  'whts the status of the plant',
  'show active alerts',
  'open alert tab',
  'show scheduled maintenance',
  'open maintenance',
  'open digital twin',
  'what is wrong with S03?',
  'why is S03 high risk?',
  'what happened to S03 over the last few inspections?',
  'when should we repair S03?',
  'which sensors are abnormal?',
  'what does MFL measure?',
  'how does DMI work?',
  'what is the financial impact if S03 fails?',
  'what about S03?',
  'why?'
];

const mockContext = {
  conveyor: INITIAL_CONVEYOR,
  splices: INITIAL_SPLICES,
  alerts: INITIAL_ALERTS,
  maintenanceTasks: INITIAL_MAINTENANCE_TASKS,
  sensorHealth: INITIAL_SENSOR_HEALTH,
  spareReadiness: INITIAL_SPARE_READINESS,
  activeTab: 'overview',
  selectedSpliceId: 'S03',
  isCameraContaminated: true
};

async function runTests() {
  server.listen(3099, async () => {
    console.log('Testing server started on 3099...\n');

    // 1. Check status endpoint
    const statusRes = await fetch('http://localhost:3099/api/copilot/status');
    const statusData = await statusRes.json();
    console.log('=== GET /api/copilot/status ===');
    console.log(JSON.stringify(statusData, null, 2));

    // 2. Execute 18 test queries sequentially
    const sessionId = 'test-session-1';
    for (let i = 0; i < testQueries.length; i++) {
      const q = testQueries[i];
      console.log(`\n--------------------------------------------------`);
      console.log(`QUERY #${i + 1}: "${q}"`);
      const res = await fetch('http://localhost:3099/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          context: mockContext,
          sessionId
        })
      });

      const data = await res.json();
      console.log(`[Source: ${data.source} | Model: ${data.modelUsed || 'Fallback'}]`);
      if (data.type === 'navigation') {
        console.log(`[NAVIGATION ACTION]: ${JSON.stringify(data.navigation)}`);
      }
      console.log(`RESPONSE:\n${data.text.slice(0, 300)}...`);
    }

    server.close(() => {
      console.log('\nTesting server closed successfully.');
      process.exit(0);
    });
  });
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
