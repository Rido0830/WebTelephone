// SkyWay音声通話デモ（p2p room）
const log = (msg) => {
  const logDiv = document.getElementById("log");
  logDiv.textContent += msg + "\n";
  logDiv.scrollTop = logDiv.scrollHeight;
  console.log(msg);
};

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const myIdSpan = document.getElementById("myId");
const statusSpan = document.getElementById("status");
const remoteAudio = document.getElementById("remoteAudio");

let context, me, room;
let joined = false;

// ★ あなたのAPIキーをここに貼ってください（絶対にGitHubに公開しないで！）
const API_KEY = "10232c12-2b1d-4bcb-b424-944877352c03", //例: "10232c12-2b1d-4bcb-b424-944877352c03"

startBtn.onclick = async () => {
  try {
    if (joined) return;
    startBtn.disabled = true;

    log("SkyWay初期化中...");
    context = await SkyWay.SkyWayContext.Create(API_KEY);

    me = await context.createLocalPerson();
    myIdSpan.textContent = me.id;
    log("あなたのID: " + me.id);

    log("マイク取得中...");
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    log("ルーム参加中...");
    room = await SkyWay.SkyWayRoom.FindOrCreate(context, { type: "p2p" });
    await room.join(me);
    joined = true;
    statusSpan.textContent = "接続中";

    // 自分の音声を送信
    await me.publish(localStream);
    log("音声送信中...");

    // 相手の音声を受信
    room.onStreamSubscribed.add(({ stream }) => {
      log("相手の音声ストリーム受信");
      remoteAudio.srcObject = stream;
    });

    // 相手の参加・退出ログ
    room.onMemberJoined.add(({ member }) => log("相手が参加: " + member.id));
    room.onMemberLeft.add(({ member }) => log("相手が退出: " + member.id));

    stopBtn.disabled = false;
  } catch (e) {
    log("エラー: " + e.message);
    startBtn.disabled = false;
  }
};

stopBtn.onclick = async () => {
  try {
    if (!joined) return;
    log("切断中...");

    await room.leave(me);
    joined = false;
    statusSpan.textContent = "切断済み";
    startBtn.disabled = false;
    stopBtn.disabled = true;

    if (remoteAudio.srcObject) {
      remoteAudio.srcObject.getTracks().forEach(t => t.stop());
      remoteAudio.srcObject = null;
    }

    log("通話を終了しました。");
  } catch (e) {
    log("切断エラー: " + e.message);
  }
};