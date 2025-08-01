import axios from 'axios';
import { ONEINCH_CONFIG, ARBITRUM_CONFIG } from '../config/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || fetch(`${import.meta.env.VITE_API_BASE_URL}`);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Wallet ${token}`;
  }
  return config;
});

export interface AuthResponse {
  authToken: string;
  user: {
    id: string;
    walletAddress: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface NonceResponse {
  message: string;
  nonce: string;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}

export const authAPI = {
  // Get nonce for wallet authentication
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    const response = await api.post('/api/auth/nonce', { walletAddress });
    return response.data;
  },

  // Authenticate with signature
  async authenticate(walletAddress: string, signature: string, message: string, timestamp: number): Promise<AuthResponse> {
    const response = await api.post('/api/auth/authenticate', {
      walletAddress,
      signature,
      message,
      timestamp
    });
    return response.data;
  },

  // Get user profile
  async getProfile(): Promise<{ user: UserProfile }> {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // Refresh nonce
  async refreshNonce(walletAddress: string): Promise<{ nonce: string }> {
    const response = await api.post('/api/auth/refresh-nonce', { walletAddress });
    return response.data;
  }
};

export const walletAPI = {
  // Get deposit address
  async getDepositAddress(): Promise<{ address: string; minimumConfirmations: number }> {
    const response = await api.get('/api/wallet/deposit-address');
    return response.data;
  },

  // Get balances
  async getBalances(): Promise<{ balances: Record<string, string> }> {
    const response = await api.get('/api/wallet/balances');
    return response.data;
  },

  // Submit deposit
  async submitDeposit(txHash: string): Promise<any> {
    const response = await api.post('/api/wallet/deposits', { txHash });
    return response.data;
  },

  // Get deposit status
  async getDepositStatus(txHash: string): Promise<any> {
    const response = await api.get(`/api/wallet/deposits/${txHash}/status`);
    return response.data;
  },

  // Swap tokens
  async swapTokens(fromToken: string, toToken: string, amount: string, slippage: number): Promise<any> {
    const response = await api.post('/api/wallet/swap', {
      fromToken,
      toToken,
      amount,
      slippage
    });
    return response.data;
  },

  // Withdraw tokens
  async withdrawTokens(tokenAddress: string, amount: string, toAddress: string): Promise<any> {
    const response = await api.post('/api/wallet/withdraw', {
      tokenAddress,
      amount,
      toAddress
    });
    return response.data;
  }
};

export const marketAPI = {
  // Get available tokens
  async getTokens(): Promise<{ tokens: Record<string, any> }> {
    const response = await api.get('/api/market/tokens');
    return response.data;
  },

  // Get gas price
  async getGasPrice(): Promise<{ gasPrice: any }> {
    const response = await api.get('/api/market/gas-price');
    return response.data;
  },

  // Get swap quote
  async getQuote(src: string, dst: string, amount: string, slippage: number): Promise<any> {
    const response = await api.get(`/api/market/quote?src=${src}&dst=${dst}&amount=${amount}&slippage=${slippage}`);
    return response.data;
  }
};

export const strategiesAPI = {
  // Get user strategies
  async getStrategies(): Promise<{ strategies: any[] }> {
    const response = await api.get('/api/strategies');
    return response.data;
  },

  // Get strategy details
  async getStrategy(strategyId: string): Promise<any> {
    const response = await api.get(`/api/strategies/${strategyId}`);
    return response.data;
  },

  // Create DCA strategy
  async createDCAStrategy(data: {
    name: string;
    fromToken: string;
    toToken: string;
    amountPerExecution: string;
    totalAmount: string;
    frequency: string;
    slippage: number;
  }): Promise<{ strategyId: string }> {
    const response = await api.post('/api/strategies/dca', data);
    return response.data;
  },

  // Pause strategy
  async pauseStrategy(strategyId: string): Promise<any> {
    const response = await api.put(`/api/strategies/${strategyId}/pause`);
    return response.data;
  },

  // Resume strategy
  async resumeStrategy(strategyId: string): Promise<any> {
    const response = await api.put(`/api/strategies/${strategyId}/resume`);
    return response.data;
  },

  // Stop strategy
  async stopStrategy(strategyId: string): Promise<any> {
    const response = await api.put(`/api/strategies/${strategyId}/stop`);
    return response.data;
  }
};

// 1inch Portfolio API
export const oneInchAPI = {
  // Get token balances for a wallet address
  async getTokenBalances(walletAddress: string, chainId: number = ARBITRUM_CONFIG.CHAIN_ID): Promise<any> {
    try {
      const url = `${ONEINCH_CONFIG.BASE_URL}${ONEINCH_CONFIG.ENDPOINTS.BALANCES(chainId, walletAddress)}`;
      
      const config = {
        headers: {
          Authorization: `Bearer ${ONEINCH_CONFIG.API_KEY}`,
        },
        params: {},
        paramsSerializer: {
          indexes: null,
        },
      };

      // Include common token addresses for Arbitrum
      const body = {
        tokens: [
          ARBITRUM_CONFIG.TOKENS.USDC,
          ARBITRUM_CONFIG.TOKENS.USDT,
          ARBITRUM_CONFIG.TOKENS.WETH,
          // Add more tokens as needed
        ],
      };

      const response = await axios.post(url, body, config);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch 1inch token balances:', error);
      throw error;
    }
  },

  // Get token information
  async getTokenInfo(chainId: number = ARBITRUM_CONFIG.CHAIN_ID): Promise<any> {
    try {
      const url = `${ONEINCH_CONFIG.BASE_URL}${ONEINCH_CONFIG.ENDPOINTS.TOKENS(chainId)}`;
      
      const config = {
        headers: {
          Authorization: `Bearer ${ONEINCH_CONFIG.API_KEY}`,
        },
      };

      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch token info:', error);
      throw error;
    }
  },

  // Parse and filter non-zero balances
  parseNonZeroBalances(balanceData: any): Array<{
    token: string;
    symbol: string;
    name: string;
    balance: string;
    formattedBalance: string;
    decimals: number;
    usdValue?: number;
  }> {
    const nonZeroBalances = [];
    
    if (balanceData && balanceData.balances) {
      for (const [tokenAddress, tokenData] of Object.entries(balanceData.balances)) {
        const data = tokenData as any;
        
        // Check if balance is greater than 0
        if (data.balance && BigInt(data.balance) > 0n) {
          const decimals = data.decimals || 18;
          const balance = data.balance;
          const formattedBalance = (parseFloat(balance) / Math.pow(10, decimals)).toFixed(6);
          
          nonZeroBalances.push({
            token: tokenAddress,
            symbol: data.symbol || 'Unknown',
            name: data.name || 'Unknown Token',
            balance: balance,
            formattedBalance: formattedBalance,
            decimals: decimals,
            usdValue: data.usdValue || 0,
          });
        }
      }
    }
    
    return nonZeroBalances;
  }
};

export default api; 