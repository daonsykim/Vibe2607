import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib

# Set Korean font for Matplotlib on Windows
try:
    matplotlib.rcParams['font.family'] = 'Malgun Gothic'
    matplotlib.rcParams['axes.unicode_minus'] = False
except Exception as e:
    print(f"Warning setting font: {e}")

# File path
file_path = r"c:\Users\user\Downloads\생산성본부_코드어시스턴트수업\DataSet\kospi_data.csv"

def clean_and_analyze():
    print("=========================================")
    print("1. 데이터 로드 및 결측치 확인/클렌징")
    print("=========================================")
    
    # 1. Load Data
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return
        
    df = pd.read_csv(file_path)
    print(f"원본 데이터 크기: {df.shape[0]}행, {df.shape[1]}열")
    print("\n[각 컬럼의 데이터 타입 및 결측치 확인]")
    print(df.info())
    
    # 2. Cleansing
    # 컬럼명 공백 제거
    df.columns = df.columns.str.strip()
    
    # 날짜 컬럼 datetime 변환
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    
    # 수치형 컬럼 변환 및 클렌징
    numeric_cols = ['Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume']
    for col in numeric_cols:
        if col in df.columns:
            # 혹시나 문자열로 인식된 경우 쉼표 제거 후 float 변환
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.replace(',', '')
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
    # 결측치 확인
    null_counts = df.isnull().sum()
    print("\n[결측치 개수]")
    print(null_counts)
    
    # Date나 Close가 결측치인 행 제거
    df = df.dropna(subset=['Date', 'Close'])
    
    # 중복 제거 및 날짜 오름차순 정렬
    df = df.drop_duplicates(subset=['Date'])
    df = df.sort_values(by='Date').reset_index(drop=True)
    
    # 3. 2000년 1월부터 2019년 연말까지 필터링 (2000-01-01 ~ 2019-12-31)
    df_filtered = df[(df['Date'] >= '2000-01-01') & (df['Date'] <= '2019-12-31')].copy()
    print(f"\n필터링 후 데이터 크기 (2000년~2019년): {df_filtered.shape[0]}행")
    print(f"실제 데이터 시작일: {df_filtered['Date'].min().strftime('%Y-%m-%d')}")
    print(f"실제 데이터 종료일: {df_filtered['Date'].max().strftime('%Y-%m-%d')}")
    
    print("\n=========================================")
    print("2. 다각도 데이터 분석")
    print("=========================================")
    
    # 2.1 기초 통계량
    print("\n[기초 통계량 (Close 기준)]")
    desc = df_filtered['Close'].describe()
    print(desc)
    
    # 2.2 전체 기간 성장률 및 CAGR
    first_row = df_filtered.iloc[0]
    last_row = df_filtered.iloc[-1]
    
    start_close = first_row['Close']
    end_close = last_row['Close']
    total_days = (last_row['Date'] - first_row['Date']).days
    years = total_days / 365.25
    
    total_return = (end_close / start_close - 1) * 100
    cagr = ((end_close / start_close) ** (1 / years) - 1) * 100
    
    print("\n[전체 기간 성장률 및 연평균 성장률(CAGR)]")
    print(f"시작일 종가 ({first_row['Date'].strftime('%Y-%m-%d')}): {start_close:.2f}")
    print(f"종료일 종가 ({last_row['Date'].strftime('%Y-%m-%d')}): {end_close:.2f}")
    print(f"전체 기간 수익률: {total_return:.2f}%")
    print(f"연평균 성장률 (CAGR): {cagr:.2f}%")
    
    # 2.3 최고점 및 최저점
    max_idx = df_filtered['Close'].idxmax()
    min_idx = df_filtered['Close'].idxmin()
    
    max_row = df_filtered.loc[max_idx]
    min_row = df_filtered.loc[min_idx]
    
    print("\n[최고점 및 최저점]")
    print(f"최고 종가: {max_row['Close']:.2f} (날짜: {max_row['Date'].strftime('%Y-%m-%d')})")
    print(f"최저 종가: {min_row['Close']:.2f} (날짜: {min_row['Date'].strftime('%Y-%m-%d')})")
    
    # 2.4 일일 최대 상승폭 및 하락폭
    df_filtered['Daily_Return'] = df_filtered['Close'].pct_change()
    df_filtered['Daily_Diff'] = df_filtered['Close'].diff()
    
    max_pct_gain = df_filtered.loc[df_filtered['Daily_Return'].idxmax()]
    max_pct_loss = df_filtered.loc[df_filtered['Daily_Return'].idxmin()]
    
    print("\n[일일 최대 변동률]")
    print(f"최대 일일 상승률: {max_pct_gain['Daily_Return']*100:.2f}% (날짜: {max_pct_gain['Date'].strftime('%Y-%m-%d')}, 변동: {max_pct_gain['Daily_Diff']:.2f}p)")
    print(f"최대 일일 하락률: {max_pct_loss['Daily_Return']*100:.2f}% (날짜: {max_pct_loss['Date'].strftime('%Y-%m-%d')}, 변동: {max_pct_loss['Daily_Diff']:.2f}p)")
    
    # 2.5 연도별 요약 통계 및 연도별 수익률
    df_filtered['Year'] = df_filtered['Date'].dt.year
    
    yearly_data = []
    years_list = sorted(df_filtered['Year'].unique())
    
    for yr in years_list:
        df_yr = df_filtered[df_filtered['Year'] == yr]
        yr_start = df_yr.iloc[0]['Close']
        yr_end = df_yr.iloc[-1]['Close']
        yr_return = (yr_end / yr_start - 1) * 100
        yr_high = df_yr['Close'].max()
        yr_low = df_yr['Close'].min()
        yr_mean = df_yr['Close'].mean()
        yr_volume = df_yr['Volume'].mean()
        
        yearly_data.append({
            '연도': yr,
            '시작종가': yr_start,
            '종료종가': yr_end,
            '연간수익률(%)': yr_return,
            '최고종가': yr_high,
            '최저종가': yr_low,
            '평균종가': yr_mean,
            '평균거래량': yr_volume
        })
        
    df_yearly = pd.DataFrame(yearly_data)
    print("\n[연도별 주요 지표 요약]")
    print(df_yearly.to_string(index=False, formatters={
        '시작종가': '{:,.2f}'.format,
        '종료종가': '{:,.2f}'.format,
        '연간수익률(%)': '{:,.2f}%'.format,
        '최고종가': '{:,.2f}'.format,
        '최저종가': '{:,.2f}'.format,
        '평균종가': '{:,.2f}'.format,
        '평균거래량': '{:,.0f}'.format
    }))
    
    # 2.6 최대 낙폭 (MDD: Maximum Drawdown) 계산
    # MDD = (Trough Value - Peak Value) / Peak Value
    rolling_max = df_filtered['Close'].cummax()
    drawdown = (df_filtered['Close'] - rolling_max) / rolling_max
    max_drawdown = drawdown.min()
    mdd_idx = drawdown.idxmin()
    mdd_date = df_filtered.loc[mdd_idx, 'Date']
    
    # MDD 시점의 Peak 찾기
    peak_before_mdd = df_filtered.loc[:mdd_idx, 'Close'].max()
    peak_idx = df_filtered.loc[:mdd_idx, 'Close'].idxmax()
    peak_date = df_filtered.loc[peak_idx, 'Date']
    
    print("\n[최대 낙폭 (MDD) 분석]")
    print(f"최대 낙폭 (MDD): {max_drawdown*100:.2f}%")
    print(f"고점 시점: {peak_date.strftime('%Y-%m-%d')} (종가: {peak_before_mdd:.2f})")
    print(f"저점 시점: {mdd_date.strftime('%Y-%m-%d')} (종가: {df_filtered.loc[mdd_idx, 'Close']:.2f})")
    
    print("\n=========================================")
    print("3. 시각화 (라인 그래프 생성)")
    print("=========================================")
    
    # Plotting
    plt.figure(figsize=(14, 7), dpi=100)
    plt.plot(df_filtered['Date'], df_filtered['Close'], color='#1f77b4', linewidth=1.5, label='KOSPI 종가')
    
    # 최고점 및 최저점 표시
    plt.scatter(max_row['Date'], max_row['Close'], color='red', s=60, zorder=5)
    plt.text(max_row['Date'], max_row['Close'] + 50, f"최고점: {max_row['Close']:.1f}\n({max_row['Date'].strftime('%Y-%m-%d')})", 
             color='red', fontsize=10, fontweight='bold', ha='center')
             
    plt.scatter(min_row['Date'], min_row['Close'], color='blue', s=60, zorder=5)
    plt.text(min_row['Date'], min_row['Close'] - 110, f"최저점: {min_row['Close']:.1f}\n({min_row['Date'].strftime('%Y-%m-%d')})", 
             color='blue', fontsize=10, fontweight='bold', ha='center')
             
    # 금융위기 등 주요 마일스톤 가이드라인 추가
    # 2008년 글로벌 금융위기 저점
    crisis_date = pd.to_datetime('2008-10-24')
    crisis_close = df_filtered[df_filtered['Date'] == crisis_date]['Close']
    if not crisis_close.empty:
        plt.scatter(crisis_date, crisis_close.values[0], color='darkorange', s=50, zorder=5)
        plt.text(crisis_date, crisis_close.values[0] - 110, f"글로벌 금융위기 저점: {crisis_close.values[0]:.1f}\n(2008-10-24)", 
                 color='darkorange', fontsize=9, ha='center')
                 
    # 2000년 IT 버블 붕괴 저점 (2000년 말 ~ 2001년 초)
    it_bubble_date = pd.to_datetime('2000-12-26')
    it_bubble_close = df_filtered[df_filtered['Date'] == it_bubble_date]['Close']
    if not it_bubble_close.empty:
        plt.scatter(it_bubble_date, it_bubble_close.values[0], color='purple', s=50, zorder=5)
        plt.text(it_bubble_date, it_bubble_close.values[0] - 110, f"IT 버블 붕괴 저점: {it_bubble_close.values[0]:.1f}\n(2000-12-26)", 
                 color='purple', fontsize=9, ha='center')

    # 그래프 스타일
    plt.title('KOSPI 지수 추이 (2000년 ~ 2019년)', fontsize=16, fontweight='bold', pad=15)
    plt.xlabel('연도 (Date)', fontsize=12)
    plt.ylabel('KOSPI 종가 (Close)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.legend(loc='upper left')
    
    # 여백 조절 및 저장
    plt.tight_layout()
    plot_output_path = r"c:\work_Anti\kospi_close_trend.png"
    plt.savefig(plot_output_path)
    plt.close()
    
    print(f"라인 그래프가 성공적으로 생성 및 저장되었습니다.\n저장 경로: {plot_output_path}")

if __name__ == "__main__":
    clean_and_analyze()
