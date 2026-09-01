import matplotlib.pyplot as plt
import datetime
import random

# GitHub ActionsはUTC(世界標準時)なので、9時間足して日本時間(JST)にする
now = datetime.datetime.utcnow() + datetime.timedelta(hours=9)
current_time_str = now.strftime('%Y-%m-%d %H:%M:%S (JST)')

# ダミーデータ
times = [f"{i}:00" for i in range(12, 18)]
temps = [random.randint(20, 30) for _ in range(6)]

plt.figure(figsize=(8, 4))
plt.plot(times, temps, marker='o', color='red')

# グラフの真ん中に大きく実行日時を書き込む
plt.title("GitHub Actions Test")
plt.text(2.5, 25, f"Generated at:\n{current_time_str}", 
         fontsize=14, color='blue', ha='center', va='center',
         bbox=dict(facecolor='white', alpha=0.8, edgecolor='blue'))

plt.xlabel("Time")
plt.ylabel("Temperature (C)")
plt.grid(True)

plt.savefig('weather.png')
