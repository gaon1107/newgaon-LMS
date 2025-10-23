const { query } = require('../config/database');

/**
 * 모든 학원(tenant) 목록 조회
 * 슈퍼관리자만 접근 가능
 */
const getAllTenants = async (req, res) => {
  try {
    // 슈퍼관리자 권한 확인
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: '슈퍼관리자만 접근할 수 있습니다.'
      });
    }

    // tenants 테이블에서 모든 학원 정보 조회
    const tenants = await query(`
      SELECT
        t.id,
        t.name as academyName,
        t.code as academyCode,
        t.business_number as businessNumber,
        t.owner_name as ownerName,
        t.phone,
        t.email,
        t.address,
        t.status,
        t.subscription_plan as subscriptionPlan,
        t.subscription_start_date as joinDate,
        t.subscription_end_date as expiryDate,
        t.max_students as maxStudents,
        t.max_instructors as maxInstructors,
        t.created_at as createdAt,
        t.sms_balance as smsBalance,
        (SELECT COUNT(*) FROM students WHERE tenant_id = t.id) as studentCount,
        (SELECT COUNT(*) FROM instructors WHERE tenant_id = t.id) as instructorCount,
        (SELECT MAX(last_login_at) FROM users WHERE tenant_id = t.id) as lastLogin
      FROM tenants t
      ORDER BY t.created_at DESC
    `);

    // 각 학원의 관리자 정보 조회
    const tenantsWithAdmin = await Promise.all(
      tenants.map(async (tenant) => {
        const admins = await query(
          'SELECT id, username, name, email FROM users WHERE tenant_id = ? AND role = "admin" LIMIT 1',
          [tenant.id]
        );

        console.log(`🔍 [학원 ${tenant.academyName}] 관리자 정보:`, admins);

        return {
          ...tenant,
          adminName: admins.length > 0 ? admins[0].name : null,
          adminUsername: admins.length > 0 ? admins[0].username : null,
          adminEmail: admins.length > 0 ? admins[0].email : null,
          adminId: admins.length > 0 ? admins[0].username : null // 등록한 아이디
        };
      })
    );

    res.json({
      success: true,
      data: tenantsWithAdmin
    });

    console.log(`✅ 학원 목록 조회 성공: ${tenantsWithAdmin.length}개`);

  } catch (error) {
    console.error('Get all tenants error:', error);
    res.status(500).json({
      success: false,
      error: '학원 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 특정 학원 상세 정보 조회
 */
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    // 슈퍼관리자 권한 확인
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: '슈퍼관리자만 접근할 수 있습니다.'
      });
    }

    const tenants = await query(
      `SELECT
        t.*,
        (SELECT COUNT(*) FROM students WHERE tenant_id = t.id) as studentCount,
        (SELECT COUNT(*) FROM instructors WHERE tenant_id = t.id) as instructorCount
      FROM tenants t
      WHERE t.id = ?`,
      [id]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: '학원을 찾을 수 없습니다.'
      });
    }

    // 관리자 정보 조회
    const admins = await query(
      'SELECT id, username, name, email, last_login_at FROM users WHERE tenant_id = ? AND role = "admin"',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...tenants[0],
        admins
      }
    });

  } catch (error) {
    console.error('Get tenant by ID error:', error);
    res.status(500).json({
      success: false,
      error: '학원 정보 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 학원 정보 수정
 */
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      businessNumber,
      ownerName,
      phone,
      email,
      address,
      status,
      subscriptionPlan,
      subscriptionEndDate,
      maxStudents,
      maxInstructors,
      smsBalance
    } = req.body;

    // 슈퍼관리자 권한 확인
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: '슈퍼관리자만 수정할 수 있습니다.'
      });
    }

    // 학원 존재 확인 및 이전 상태 조회
    const existingTenants = await query('SELECT id, status FROM tenants WHERE id = ?', [id]);
    if (existingTenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: '학원을 찾을 수 없습니다.'
      });
    }

    const previousStatus = existingTenants[0].status;

    // 학원 정보 업데이트
    await query(
      `UPDATE tenants SET
        name = ?,
        business_number = ?,
        owner_name = ?,
        phone = ?,
        email = ?,
        address = ?,
        status = ?,
        subscription_plan = ?,
        subscription_end_date = ?,
        max_students = ?,
        max_instructors = ?,
        sms_balance = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        name,
        businessNumber,
        ownerName,
        phone,
        email,
        address,
        status,
        subscriptionPlan,
        subscriptionEndDate,
        maxStudents,
        maxInstructors,
        smsBalance,
        id
      ]
    );

    // 상태가 변경된 경우 해당 학원의 사용자들도 활성화/비활성화
    if (previousStatus !== status) {
      const isActive = status === 'active';
      await query(
        'UPDATE users SET is_active = ?, updated_at = NOW() WHERE tenant_id = ?',
        [isActive, id]
      );

      console.log(`✅ 학원 상태 변경: ${previousStatus} → ${status}, 사용자 ${isActive ? '활성화' : '비활성화'} 완료`);
    }

    res.json({
      success: true,
      message: '학원 정보가 수정되었습니다.'
    });

    console.log(`✅ 학원 정보 수정 완료: ${name} (ID: ${id})`);

  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      success: false,
      error: '학원 정보 수정 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 학원 삭제
 */
const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    // 슈퍼관리자 권한 확인
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: '슈퍼관리자만 삭제할 수 있습니다.'
      });
    }

    // 학원 존재 확인
    const existingTenants = await query('SELECT id, name FROM tenants WHERE id = ?', [id]);
    if (existingTenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: '학원을 찾을 수 없습니다.'
      });
    }

    // 학원 삭제 (실제로는 status를 'inactive'로 변경)
    await query(
      'UPDATE tenants SET status = "inactive", updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '학원이 삭제되었습니다.'
    });

    console.log(`✅ 학원 삭제 완료: ${existingTenants[0].name} (ID: ${id})`);

  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      success: false,
      error: '학원 삭제 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 현재 사용자의 학원 정보 조회
 */
const getMyTenant = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const tenants = await query(
      `SELECT
        t.id,
        t.name as academyName,
        t.code as academyCode,
        t.business_number as businessNumber,
        t.owner_name as ownerName,
        t.phone,
        t.email,
        t.address,
        t.status,
        t.subscription_plan as subscriptionPlan,
        t.subscription_start_date as subscriptionStartDate,
        t.subscription_end_date as subscriptionEndDate,
        t.max_students as maxStudents,
        t.max_instructors as maxInstructors,
        t.created_at as createdAt,
        t.sms_balance as smsBalance
      FROM tenants t
      WHERE t.id = ?`,
      [tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: '학원 정보를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: tenants[0]
    });

  } catch (error) {
    console.error('Get my tenant error:', error);
    res.status(500).json({
      success: false,
      error: '학원 정보 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 현재 사용자의 학원 정보 수정
 */
const updateMyTenant = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const {
      name,
      businessNumber,
      ownerName,
      phone,
      email,
      address
    } = req.body;

    // 학원 존재 확인
    const existingTenants = await query('SELECT id FROM tenants WHERE id = ?', [tenantId]);
    if (existingTenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: '학원을 찾을 수 없습니다.'
      });
    }

    // 학원 정보 업데이트 (일반 사용자는 제한된 필드만 수정 가능)
    await query(
      `UPDATE tenants SET
        name = ?,
        business_number = ?,
        owner_name = ?,
        phone = ?,
        email = ?,
        address = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        name,
        businessNumber,
        ownerName,
        phone,
        email,
        address,
        tenantId
      ]
    );

    res.json({
      success: true,
      message: '학원 정보가 수정되었습니다.'
    });

    console.log(`✅ 학원 정보 수정 완료: ${name} (tenant_id: ${tenantId}, user_id: ${req.user.id})`);

  } catch (error) {
    console.error('Update my tenant error:', error);
    res.status(500).json({
      success: false,
      error: '학원 정보 수정 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 현재 사용자의 학원 탈퇴 (비밀번호 확인 필요)
 */
const deleteMyTenant = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { password } = req.body;

    // 비밀번호 확인 필수
    if (!password) {
      return res.status(400).json({
        success: false,
        error: '비밀번호를 입력해주세요.'
      });
    }

    // 사용자 정보 조회 (비밀번호 확인용)
    const users = await query(
      'SELECT id, username, password_hash, name FROM users WHERE id = ? AND tenant_id = ?',
      [req.user.id, tenantId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    const user = users[0];

    // 비밀번호 검증
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '비밀번호가 일치하지 않습니다.'
      });
    }

    // 학원 정보 조회
    const tenants = await query('SELECT id, name FROM tenants WHERE id = ?', [tenantId]);
    if (tenants.length === 0) {
      return res.status(404).json({
        success: false,
        error: '학원을 찾을 수 없습니다.'
      });
    }

    // 학원 삭제 (status를 'inactive'로 변경)
    await query(
      'UPDATE tenants SET status = ?, updated_at = NOW() WHERE id = ?',
      ['inactive', tenantId]
    );

    // 해당 학원의 모든 사용자 비활성화
    await query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE tenant_id = ?',
      [tenantId]
    );

    res.json({
      success: true,
      message: '탈퇴가 완료되었습니다.'
    });

    console.log(`✅ 학원 탈퇴 완료: ${tenants[0].name} (tenant_id: ${tenantId}, user: ${user.username})`);

  } catch (error) {
    console.error('Delete my tenant error:', error);
    res.status(500).json({
      success: false,
      error: '탈퇴 처리 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getMyTenant,
  updateMyTenant,
  deleteMyTenant
};
