// Mock Supabase Client for local/offline development without .env credentials
// Saves data to localStorage and simulates queries, inserts, updates, and auth.

interface GratitudeItem {
  id: number;
  thing: string;
  reason: string;
}

export const initializeMockData = () => {
  if (typeof window === 'undefined') return;

  if (localStorage.getItem('mock-supabase-initialized') === 'true') {
    return;
  }

  // 1. Initial Mock Users
  const initialUsers = [
    {
      id: 'user-admin',
      email: 'admin@eurus.dev',
      password: 'password123',
      user_metadata: { full_name: 'Admin Eurus' }
    },
    {
      id: 'user-tien',
      email: 'tiendv@company.com',
      password: 'password123',
      user_metadata: { full_name: 'Tiến Đặng' }
    },
    {
      id: 'user-hoang',
      email: 'hoangnm@company.com',
      password: 'password123',
      user_metadata: { full_name: 'Hoàng Nguyễn' }
    },
    {
      id: 'user-linh',
      email: 'linhpth@company.com',
      password: 'password123',
      user_metadata: { full_name: 'Linh Phan' }
    }
  ];

  // 2. Initial Mock Profiles
  const initialProfiles = [
    {
      id: 'user-admin',
      email: 'admin@eurus.dev',
      full_name: 'Admin Eurus',
      avatar_url: null,
      role: 'admin',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString()
    },
    {
      id: 'user-tien',
      email: 'tiendv@company.com',
      full_name: 'Tiến Đặng',
      avatar_url: null,
      role: 'member',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60000).toISOString()
    },
    {
      id: 'user-hoang',
      email: 'hoangnm@company.com',
      full_name: 'Hoàng Nguyễn',
      avatar_url: null,
      role: 'member',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60000).toISOString()
    },
    {
      id: 'user-linh',
      email: 'linhpth@company.com',
      full_name: 'Linh Phan',
      avatar_url: null,
      role: 'member',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60000).toISOString()
    }
  ];

  // 3. Initial Mock Reports (for the last 7 days)
  const initialReports: any[] = [];
  const datesList: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    datesList.push(d.toLocaleDateString('en-CA'));
  }

  // Realistic tasks for members
  const memberTasks = {
    'user-tien': [
      { today: 'Tìm hiểu hạ tầng mạng, nghiên cứu cài đặt aaPanel trên VPS Ubuntu.', next: 'Tiến hành tối ưu hóa cơ sở dữ liệu MySQL và WordPress.' },
      { today: 'Khắc phục lỗi phân quyền thư mục trên aaPanel, cấu hình backup dữ liệu tự động.', next: 'Kết nối Cloudflare Tunnel để bảo vệ server WordPress.' },
      { today: 'Tạo Cloudflare Tunnel bảo mật, tắt các port công khai không cần thiết.', next: 'Kiểm tra tốc độ tải trang (PageSpeed Insights) và tối ưu cache.' },
      { today: 'Tối ưu hóa cache của WordPress, sửa cấu hình WP Super Cache.', next: 'Viết tài liệu hướng dẫn bàn giao hạ tầng cho sếp.' },
      { today: 'Bàn giao hạ tầng, viết tài liệu hướng dẫn kỹ thuật chi tiết.', next: 'Tìm hiểu thêm về cấu hình bảo mật DNS Cloudflare.' },
      { today: 'Nghiên cứu cấu hình DNS Cloudflare, DNSSEC và SSL Full Strict.', next: 'Lập kế hoạch bảo trì định kỳ cho tháng sau.' }
    ],
    'user-hoang': [
      { today: 'Tối ưu tài nguyên container Docker, dọn dẹp cache Docker volume dư thừa.', next: 'Kiểm tra tài nguyên CPU/RAM trên AWS EC2.' },
      { today: 'Khắc phục lỗi tràn bộ nhớ (Out of Memory) của node service trên AWS EC2.', next: 'Tích hợp webhook Sepay để xử lý giao dịch tự động.' },
      { today: 'Tích hợp webhook Sepay thành công, xử lý callback và lưu lịch sử giao dịch vào db.', next: 'Viết test cases kiểm thử luồng thanh toán.' },
      { today: 'Kiểm thử luồng thanh toán tự động, phát hiện và sửa 3 lỗi logic giao dịch.', next: 'Cấu hình SSL Let\'s Encrypt cho subdomain của Sepay webhook.' },
      { today: 'Cấu hình SSL Let\'s Encrypt thành công, cập nhật tài liệu kỹ thuật dự án.', next: 'Nghiên cứu setup CI/CD thông qua Github Actions.' },
      { today: 'Viết file cấu hình Github Actions tự động deploy dự án khi push code.', next: 'Hỗ trợ test hiệu năng tổng quát toàn hệ thống.' }
    ],
    'user-linh': [
      { today: 'Vẽ Wireframe và thiết kế Mockup UI trang Dashboard theo phong cách Glassmorphism.', next: 'Cắt giao diện trang Dashboard bằng Tailwind CSS.' },
      { today: 'Hoàn thành code giao diện trang Dashboard, tối ưu Responsive trên Mobile/Tablet.', next: 'Tạo hiệu ứng biểu đồ sinh động bằng Recharts.' },
      { today: 'Tích hợp thư viện Recharts vẽ biểu đồ tiến độ nộp báo cáo.', next: 'Làm việc với backend để kết nối các API thông số.' },
      { today: 'Kết nối dữ liệu biểu đồ với API, tối ưu hóa tốc độ load của component.', next: 'Thiết kế trang Login và Register đồng bộ visual.' },
      { today: 'Hoàn thành thiết kế và code giao diện trang Đăng nhập & Đăng ký.', next: 'Kiểm thử toàn bộ luồng giao diện người dùng (User Flow).' },
      { today: 'Kiểm thử UI/UX, sửa các lỗi lệch layout trên trình duyệt Safari.', next: 'Nghiên cứu thêm các thư viện animation như Framer Motion.' }
    ]
  };

  datesList.forEach((dateStr, index) => {
    const isToday = index === 0;

    // Tien submitted all days
    const tienTask = memberTasks['user-tien'][index % 6];
    const tienLate = index === 2 || index === 5;
    const tienCreated = new Date(dateStr + (tienLate ? 'T18:30:00' : 'T15:20:00'));
    initialReports.push({
      id: `report-tien-${dateStr}`,
      user_id: 'user-tien',
      report_date: dateStr,
      today_tasks: tienTask.today,
      lessons_learned: 'Học cách làm việc với các hệ thống Linux, các lệnh shell cơ bản.',
      problems_and_solutions: 'Bị lỗi permission ghi file -> Giải pháp: chmod 755.',
      next_day_plan: tienTask.next,
      created_at: tienCreated.toISOString(),
      updated_at: tienCreated.toISOString()
    });

    // Hoang submitted all days
    const hoangTask = memberTasks['user-hoang'][index % 6];
    const hoangLate = index === 0 || index === 4;
    const hoangCreated = new Date(dateStr + (hoangLate ? 'T17:15:00' : 'T16:05:00'));
    initialReports.push({
      id: `report-hoang-${dateStr}`,
      user_id: 'user-hoang',
      report_date: dateStr,
      today_tasks: hoangTask.today,
      lessons_learned: 'Đúc kết bài học về quản lý vòng đời bộ nhớ trong Node.js.',
      problems_and_solutions: 'Memory leak -> Cách giải quyết: dùng profile heapdump.',
      next_day_plan: hoangTask.next,
      created_at: hoangCreated.toISOString(),
      updated_at: hoangCreated.toISOString()
    });

    // Linh submitted all days EXCEPT today
    if (!isToday) {
      const linhTask = memberTasks['user-linh'][(index - 1) % 6];
      const linhLate = index === 3;
      const linhCreated = new Date(dateStr + (linhLate ? 'T19:00:00' : 'T14:50:00'));
      initialReports.push({
        id: `report-linh-${dateStr}`,
        user_id: 'user-linh',
        report_date: dateStr,
        today_tasks: linhTask.today,
        lessons_learned: 'Nắm vững các thuộc tính CSS Flexbox và Grid nâng cao.',
        problems_and_solutions: 'Trình duyệt safari bị vỡ layout -> Fix bằng autoprefixer.',
        next_day_plan: linhTask.next,
        created_at: linhCreated.toISOString(),
        updated_at: linhCreated.toISOString()
      });
    }
  });

  // 4. Initial Mock Gratitude Logs
  const initialGratitudeLogs = [
    {
      id: 'log-tien-1',
      user_id: 'user-tien',
      day_number: 1,
      log_date: datesList[2],
      gratitude_list: [
        { id: 1, thing: 'Gia đình', reason: 'Luôn ủng hộ và động viên tôi học tập' },
        { id: 2, thing: 'Người hướng dẫn', reason: 'Nhiệt tình chỉ bảo cài đặt hạ tầng mạng' },
        { id: 3, thing: 'Internet', reason: 'Giúp tôi tiếp cận nguồn tài liệu học lập trình khổng lồ' },
        { id: 4, thing: 'Máy tính cá nhân', reason: 'Công cụ đắc lực làm việc mỗi ngày' },
        { id: 5, thing: 'Sách kỹ thuật', reason: 'Cho tôi những nền tảng lý thuyết mạng vững chắc' },
        { id: 6, thing: 'Các bạn đồng nghiệp', reason: 'Vui vẻ thảo luận và chia sẻ kinh nghiệm' },
        { id: 7, thing: 'Nước uống sạch', reason: 'Giúp cơ thể tỉnh táo làm việc hiệu quả' },
        { id: 8, thing: 'Bữa sáng ngon miệng', reason: 'Cung cấp năng lượng cho ngày dài' },
        { id: 9, thing: 'Quãng đường đi học', reason: 'Trải nghiệm ngắm phố phường mát mẻ' },
        { id: 10, thing: 'Thời tiết mát mẻ hôm nay', reason: 'Làm tâm trạng học tập thoải mái hơn' }
      ],
      magic_stone_thought: 'Biết ơn vì đã hoàn thành nhiệm vụ setup VPS đầu tiên trong đời mà không lỗi.',
      day_specific_practice: {},
      created_at: new Date(datesList[2] + 'T21:00:00').toISOString()
    },
    {
      id: 'log-hoang-1',
      user_id: 'user-hoang',
      day_number: 1,
      log_date: datesList[2],
      gratitude_list: [
        { id: 1, thing: 'Cơ hội thực tập', reason: 'Được làm việc trực tiếp trên hạ tầng AWS' },
        { id: 2, thing: 'Docker', reason: 'Giúp triển khai ứng dụng nhất quán cực kỳ nhanh chóng' },
        { id: 3, thing: 'Anh quản lý', reason: 'Giải đáp tận tình lỗi cấu hình RAM EC2' },
        { id: 4, thing: 'Ly cafe sữa', reason: 'Nạp năng lượng tập trung debug' },
        { id: 5, thing: 'StackOverflow', reason: 'Cứu cánh giải quyết lỗi OOM' },
        { id: 6, thing: 'Github', reason: 'Công cụ lưu trữ mã nguồn an toàn tiện lợi' },
        { id: 7, thing: 'Môi trường làm việc yên tĩnh', reason: 'Giúp tôi suy nghĩ các giải pháp hệ thống' },
        { id: 8, thing: 'Âm nhạc không lời', reason: 'Giảm bớt căng thẳng khi fix bug' },
        { id: 9, thing: 'Giấc ngủ ngon đêm qua', reason: 'Cho tôi tinh thần sảng khoái sáng nay' },
        { id: 10, thing: 'Thành công fix bug EC2', reason: 'Cảm giác chiến thắng bản thân tuyệt vời' }
      ],
      magic_stone_thought: 'Hôm nay biết ơn nhất vì đã fix xong lỗi memory leak chạy ổn định hệ thống.',
      day_specific_practice: {},
      created_at: new Date(datesList[2] + 'T21:15:00').toISOString()
    }
  ];

  localStorage.setItem('mock-supabase-users', JSON.stringify(initialUsers));
  localStorage.setItem('mock-supabase-profiles', JSON.stringify(initialProfiles));
  localStorage.setItem('mock-supabase-reports', JSON.stringify(initialReports));
  localStorage.setItem('mock-supabase-gratitude_logs', JSON.stringify(initialGratitudeLogs));
  localStorage.setItem('mock-supabase-initialized', 'true');
};

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderField: string | null = null;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private updatePayload: any = null;
  private isUpdate: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getItems(): any[] {
    if (typeof window === 'undefined') return [];
    initializeMockData();
    const data = localStorage.getItem(`mock-supabase-${this.tableName}`);
    return data ? JSON.parse(data) : [];
  }

  private saveItems(items: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`mock-supabase-${this.tableName}`, JSON.stringify(items));
  }

  select(columns?: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((item) => item[column] >= value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((item) => item[column] <= value);
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderField = column;
    this.orderDirection = ascending ? 'asc' : 'desc';
    return this;
  }

  async single() {
    let items = this.getItems();
    for (const filter of this.filters) {
      items = items.filter(filter);
    }
    if (items.length === 0) {
      return { data: null, error: { message: 'Không tìm thấy dòng tương ứng (Mock)' } };
    }
    return { data: items[0], error: null };
  }

  async maybeSingle() {
    let items = this.getItems();
    for (const filter of this.filters) {
      items = items.filter(filter);
    }
    return { data: items.length > 0 ? items[0] : null, error: null };
  }

  async insert(payloads: any[]) {
    const items = this.getItems();
    const newItems = payloads.map(payload => ({
      id: Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...payload
    }));
    this.saveItems([...items, ...newItems]);
    return { data: newItems, error: null };
  }

  update(payload: any) {
    this.isUpdate = true;
    this.updatePayload = payload;
    return this;
  }

  // Fluent api chaining for eq after update
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any): Promise<any> {
    try {
      let result;
      if (this.isUpdate) {
        let items = this.getItems();
        items = items.map(item => {
          const matches = this.filters.every(filter => filter(item));
          if (matches) {
            return {
              ...item,
              ...this.updatePayload,
              updated_at: new Date().toISOString()
            };
          }
          return item;
        });
        this.saveItems(items);
        result = { data: null, error: null };
      } else {
        let items = this.getItems();
        for (const filter of this.filters) {
          items = items.filter(filter);
        }
        if (this.orderField) {
          const field = this.orderField;
          const dir = this.orderDirection;
          items.sort((a, b) => {
            if (a[field] < b[field]) return dir === 'asc' ? -1 : 1;
            if (a[field] > b[field]) return dir === 'asc' ? 1 : -1;
            return 0;
          });
        }
        result = { data: items, error: null };
      }
      return onfulfilled ? onfulfilled(result) : result;
    } catch (err: any) {
      const errorResult = { data: null, error: err };
      return onrejected ? onrejected(err) : errorResult;
    }
  }
}

class MockAuth {
  private getSessionData() {
    if (typeof window === 'undefined') return null;
    initializeMockData();
    const data = localStorage.getItem('mock-supabase-session');
    return data ? JSON.parse(data) : null;
  }

  private saveSessionData(session: any) {
    if (typeof window === 'undefined') return;
    if (session) {
      localStorage.setItem('mock-supabase-session', JSON.stringify(session));
    } else {
      localStorage.removeItem('mock-supabase-session');
    }
  }

  private getUsers(): any[] {
    if (typeof window === 'undefined') return [];
    initializeMockData();
    const data = localStorage.getItem('mock-supabase-users');
    return data ? JSON.parse(data) : [];
  }

  private saveUsers(users: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mock-supabase-users', JSON.stringify(users));
  }

  async getSession() {
    const session = this.getSessionData();
    return { data: { session }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const session = this.getSessionData();
    // Simulate async callback
    setTimeout(() => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    }, 50);

    if (typeof window !== 'undefined') {
      (window as any).__mockAuthCallback = callback;
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            if (typeof window !== 'undefined') {
              delete (window as any).__mockAuthCallback;
            }
          }
        }
      }
    };
  }

  async signInWithPassword({ email, password }: any) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { data: { session: null }, error: new Error('Sai thông tin đăng nhập! (Email: tiendv@company.com / password123)') };
    }

    const session = {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    this.saveSessionData(session);

    if (typeof window !== 'undefined' && (window as any).__mockAuthCallback) {
      (window as any).__mockAuthCallback('SIGNED_IN', session);
    }

    return { data: { session }, error: null };
  }

  async signUp({ email, password, options }: any) {
    const users = this.getUsers();
    if (users.some(u => u.email === email)) {
      return { data: null, error: new Error('Email này đã được đăng ký tài khoản!') };
    }

    const userId = 'mock-user-' + Math.random().toString(36).substring(2, 11);
    const fullName = options?.data?.full_name || 'Thành viên mới';
    const role = users.length === 0 ? 'admin' : 'member';

    const newUser = {
      id: userId,
      email,
      password,
      user_metadata: {
        full_name: fullName
      }
    };

    this.saveUsers([...users, newUser]);

    const profilesStr = localStorage.getItem('mock-supabase-profiles') || '[]';
    const profiles = JSON.parse(profilesStr);
    const newProfile = {
      id: userId,
      email,
      full_name: fullName,
      avatar_url: null,
      role,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('mock-supabase-profiles', JSON.stringify([...profiles, newProfile]));

    const session = {
      user: {
        id: userId,
        email,
        user_metadata: {
          full_name: fullName
        }
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    this.saveSessionData(session);

    if (typeof window !== 'undefined' && (window as any).__mockAuthCallback) {
      (window as any).__mockAuthCallback('SIGNED_IN', session);
    }

    return { data: { session, user: session.user }, error: null };
  }

  async signOut() {
    this.saveSessionData(null);
    if (typeof window !== 'undefined' && (window as any).__mockAuthCallback) {
      (window as any).__mockAuthCallback('SIGNED_OUT', null);
    }
    return { error: null };
  }
}

export const createMockSupabaseClient = () => {
  return {
    auth: new MockAuth(),
    from: (tableName: string) => new MockQueryBuilder(tableName)
  };
};
