import yfinance as yf
import pandas as pd
from pandas import DataFrame, json_normalize
import numpy as np
import requests
import json
import simplejson
from datetime import datetime
import schedule
import time
import os
from pathlib import Path
import BlobStorage.BlobStorageYedek as blob
import Indexing.createOrUpdateIndex as create_index
#import Indexing.createindex as create_index
import pytz
import re


# Returns a pandas dataframe for specified ticker and start-end dates
# period -> String, must be one of ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'], depends on the ticker
# ticker_symbol -> String (ex. 'AAPL', 'TSLA')
def getTickerDataPeriod(ticker_symbol, period):
    ticker_data = yf.download(ticker_symbol, period=period)
    return ticker_data

# Returns a pandas dataframe for specified ticker and start-end dates
# ticker_symbol -> String (ex. 'AAPL', 'TSLA')
# start_date, end_date -> String in yyyy-mm-dd format
def getTickerDataDate(ticker_symbol, start_date, end_date, interval):
    ticker_data = yf.download(ticker_symbol, start=start_date, end=end_date, interval=interval)
    return ticker_data

# Creates a json from scratch, converting numpy.Timestamp() to a string
# So that it can be dumped
def removeTimestamp(our_dict, ticker):
    to_json = {}
    to_json['Name'] = ticker
    for title in our_dict.keys():
      if isinstance(title, tuple):
        return None
      to_json[title] = {}
      for key in our_dict[title].keys():
        if isinstance(key, tuple):
           return None
        to_json[title][key.strftime("%Y-%m-%d %H:%M:%S")] = our_dict[title][key]
    return to_json

# Returns resulting json file of a given ticker
def convertToJson(symbol, period, need_date = False, *start_end, interval='1h'):
  df = None
  if not need_date:
    df = getTickerDataPeriod(symbol, period)
  else:
    df = getTickerDataDate(symbol, start_end[0], start_end[1], interval=interval)
    
  if df.empty or df is None:
    return None
  our_json = df.to_dict()
  to_json = removeTimestamp(our_json, symbol)
  return to_json

# Non ascii characters caused formatting errors in jsons so it is replaced with format friendly ones
def asciify(target):
   target = target.replace("\u0131", "i").replace("\u00dc", "U").replace("\u011f","g").replace("\u00e7", "c").replace("\u015f","s")
   target = target.replace("\u0130", "I").replace("\u00c7", "C").replace("\u00f6","o").replace("\u00fc", "u").replace("\u015e", "S")
   target = target.replace("\u00d6", "O")
   return target

# jsons are dumped both in home directory and BlobStorage/DataFiles
def dumpToBlob(name, temp, data_folder):
  with open(data_folder / f'{name}.json', 'w') as f:
    simplejson.dump(temp, f, ensure_ascii=True, indent=2, ignore_nan=True)  
    f.close()
  with open(f"{name}.json", 'w') as f:
    simplejson.dump(temp, f, ensure_ascii=True, indent=2, ignore_nan=True)
    f.close()


def get_stocks(stock_list, name_list, data_folder, today,index, interval = '1h', is_crypto = False):
    limit = 0
    for stock_tuple in zip(stock_list, name_list, strict=True):
      new_json = [{}]
      stock = stock_tuple[0]
      name = stock_tuple[1]

      new_json[0]['Name'] = asciify(name)
      new_json[0]['Symbol'] = stock
      new_json[0]['Type'] = 'Crypto' if is_crypto else 'Stock'
      
      if not is_crypto:
        new_json[0]['Index'] = index
        new_json[0]['StockExchange'] = getExchange(stock)
      try:
        to_json = convertToJson(stock, '1d', True, '2024-07-17', today, interval=interval)
        
        if to_json is None:
          continue
        
        for key in to_json['Open'].keys():
          temp1 = {}
          temp2 = {}
          temp2['AnlikDeger'] = to_json['Open'][key]
          temp2['Volume'] = to_json['Volume'][key]
          temp1['Date: ' + key] = temp2.copy()
          
          new_json[0].update(temp1.copy())

        dumpToBlob(asciify(name), new_json, data_folder)

        limit += 1
        if limit > 10:
          blob.upload_batch()
          limit = 0
      except:
        print("what happened?")
        continue
      
    if limit > 0:
      blob.upload_batch()
      limit = 0

def getCurrency(data_folder, today_tr):
  
  response = requests.get("https://evds2.tcmb.gov.tr/service/evds/serieList/type=json&code=bie_dkdovytl", headers= {'key':'3wDP3F3LPD'}).json()
  for res in response:
    try: 
      req_str = f"https://evds2.tcmb.gov.tr/service/evds/series={res['SERIE_CODE']}&startDate=17-07-2024&endDate={today_tr}&type=json&aggregationTypes=last&formulas=0&frequency=1"
      values = requests.get(req_str, headers={'key': '3wDP3F3LPD'}).json()
      temp = [{}]
      temp[0]['Name'] = re.findall(r"(?<=\) )(.*?)(?= \()", asciify(res['SERIE_NAME']))[0]
      temp[0]['Symbol'] = re.findall(r"(?<=\()(.*?)(?=\))", asciify(res['SERIE_NAME']))[0]
      temp[0]['Action'] = re.findall(r"(?<=\()(.*?)(?=\))", asciify(res['SERIE_NAME']))[1]
      temp[0]['Type'] = 'Currency (kur)'
      for dic in values['items']:
        converted_date = datetime.strptime(dic['Tarih'], '%d-%m-%Y').strftime('%Y-%m-%d')
        add = {}
        add['AnlikDeger'] = dic[res['SERIE_CODE'].replace(".", "_")]
        temp[0][f'Date: {converted_date}'] = add
        
      dumpToBlob(asciify(res['SERIE_NAME']), temp, data_folder)
      
    except Exception as e:
      print(e)
      continue
  #blob.upload_batch()
      
def getExchange(symbol):
   if ".IS" in symbol:
      return "Istanbul Stock Exchange"
   elif ".L" in symbol:
      return "London Stock Exchange"
   elif ".DE" in symbol:
      return "Frankfurt Stock Exchange"
   elif ".AS" in symbol:
      return "Euronext"
   elif ".PA" in symbol:
      return "Euronext Paris"
   elif ".BR" in symbol:
      return "Euronext"
   elif ".MC" in symbol:
      return "Bolsa de Madrid"
   elif ".MI" in symbol:
      return "Borsa Italiana"
   elif ".HE" in symbol:
      return "Nasdaq Helsinki"
   elif ".HK" in symbol:
      return "Hong Kong Stock Exchange"
   else:
      return "New York Stock Exchange / NASDAQ"

#TODO: Merge previous day's json with current json
def fetchAll():

    today = datetime.today().strftime('%Y-%m-%d')
    today_tr = datetime.today().strftime('%d-%m-%Y')
    # get s&p500 tickers
    tables=pd.read_html("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies")
    sp_500 = list(tables[0]['Symbol'])
    sp_500_names = list(tables[0]['Security'])
    
    # get bist tickers
    tables=pd.read_html("https://tr.wikipedia.org/wiki/Borsa_%C4%B0stanbul", match='Kod')
    bist_list = list(tables[0]['Kod [9]'])
    bist_names = list(tables[0]['Firma Adı'])
    bist_100 = [x + '.IS' for x in bist_list]

    # FTSE 100 tickers
    tables=pd.read_html("https://en.wikipedia.org/wiki/FTSE_100_Index", match='Ticker')
    london_exc = list(tables[0]['Ticker'])
    london_exc = [x + ".L" for x in london_exc]
    london_name = list(tables[0]['Company'])

    # Euro Stoxx 50
    tables=pd.read_html("https://en.wikipedia.org/wiki/EURO_STOXX_50", match='Ticker')
    stoxx = list(tables[0]['Ticker'])
    stoxx_name = list(tables[0]['Name'])

    # Hang Seng tickers
    tables=pd.read_html("https://en.wikipedia.org/wiki/Hang_Seng_Index", match='Ticker')
    hk_tickers = list(tables[0]['Ticker'])
    hk_tickers = ["0"*(4-len(x[6::])) + x[6::] + ".HK" for x in hk_tickers]
    hk_name = list(tables[0]['Name'])
    

    cryptos = ['BTC-USD', 'ETH-USD', 'USDT-USD', 'BNB-USD', 'SOL-USD', 'USDC-USD', 'XRP-USD', 'TON-USD', 'DOGE-USD',
                    'ADA-USD', 'TRX-USD', 'AVAX-USD', 'SHIB-USD', 'WBTC-USD', 'DOT-USD', 'LINK-USD', 'BCH-USD', 'NEAR-USD',
                      'MATIC-USD', 'LTC-USD', 'DAI-USD', 'LEO-USD', 'PEPE-USD', 'UNI-USD', 'ICP-USD', 'KAS-USD', 'FET-USD',
                        'ETC-USD', 'APT-USD', 'XLM-USD', 'XMR-USD', 'STX-USD', 'MKR-USD', 'HBAR-USD', 'FIL-USD', 'OKB-USD', 'VET-USD',
                          'ATOM-USD', 'MNT-USD', 'ARB-USD', 'CRO-USD', 'INJ-USD', 'IMX-USD', 'SUI-USD', 'OP-USD', 'GRT-USD', 'FDUSD-USD']

    crypto_names = ['Bitcoin', 'Ethereum', 'USD Coin', 'BNB', 'Solana', 'USD Coin', 'XRP', 'Toncoin', 'Dogecoin',
                    'Cardano', 'TRON', 'Avalanche', 'Shiba Inu', 'Wrapped Bitcoin', 'Polkadot', 'Chainlink', 'Bitcoin Cash', 'NEAR Protocol',
                      'Polygon', 'Litecoin', 'Dai', 'UNUS SED LEO', 'Pepe', 'Uniswap', 'Internet Computer', 'Kaspa', 'Artificial Superintelligence Alliance',
                        'Etherium Classic', 'Aptos', 'Stellar', 'Monero', 'Stacks', 'Maker', 'Hedera', 'Filecoin', 'OKB', 'VeChain',
                          'Cosmos', 'Mantle', 'Arbitrum', 'Cronos', 'Injective', 'Immutable X', 'Sui', 'Optimism', 'The Graph', 'First Digital USD']

    data_folder = Path("BlobStorage/DataFiles")
    
    get_stocks(sp_500, sp_500_names, data_folder,today, "S&P 500", interval='1h')
    get_stocks(bist_100,bist_names, data_folder,today, "BIST 100", interval='1h')
    get_stocks(cryptos,crypto_names, data_folder, today, "crypto", interval='1h', is_crypto=True)
    get_stocks(london_exc, london_name, data_folder, today, "FTSE 100", interval = '1h')
    get_stocks(stoxx,stoxx_name,data_folder, today, "Stoxx Europe 50", interval='1h')
    get_stocks(hk_tickers,hk_name, data_folder, today, "Hang Seng Index", interval='1h')
    getCurrency(data_folder,today_tr)

  # index them all at the end
    create_index.main()
    
def fetch_schedule():
  
  newpath = r'BlobStorage/DataFiles' 
  if not os.path.exists(newpath):
    os.makedirs(newpath)

  for file in os.scandir("."):
    if file.name.endswith(".json"):
        os.unlink(file.path)
  
  for file in os.scandir("./BlobStorage/DataFiles"):
     if file.name.endswith(".json"):
        os.unlink(file.path)
  
  #schedule.every().monday.at("23:30", pytz.timezone("Europe/Istanbul")).do(fetchAll)
  #schedule.every().tuesday.at("23:30", pytz.timezone("Europe/Istanbul")).do(fetchAll)
  #schedule.every().wednesday.at("23:30", pytz.timezone("Europe/Istanbul")).do(fetchAll)
  #schedule.every().thursday.at("23:30", pytz.timezone("Europe/Istanbul")).do(fetchAll)
  #schedule.every().friday.at("23:30", pytz.timezone("Europe/Istanbul")).do(fetchAll)
  
  #while True:
  #  schedule.run_pending()
  #  time.sleep(1)

fetch_schedule()
fetchAll()